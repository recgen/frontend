"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/context/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  Send,
  Loader2,
  ChevronLeft,
  ChevronRight,
  FileText,
  Heart,
  Thermometer,
  Activity,
  Trash2,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const REC_PAGE_SIZE = 10;

function formatAge(birthDate) {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  const lastDigit = age % 10;
  const lastTwo = age % 100;

  let word;
  if (lastTwo >= 11 && lastTwo <= 14) {
    word = "лет";
  } else if (lastDigit === 1) {
    word = "год";
  } else if (lastDigit >= 2 && lastDigit <= 4) {
    word = "года";
  } else {
    word = "лет";
  }

  return `${age} ${word}`;
}

function formatGender(gender) {
  if (!gender) return null;
  return gender === "MALE" ? "Мужчина" : gender === "FEMALE" ? "Женщина" : gender;
}

function formatBirthDate(birthDate) {
  if (!birthDate) return null;
  return new Date(birthDate).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function PatientPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const patientFetched = useRef(false);
  const recFetched = useRef(false);

  const [patient, setPatient] = useState(null);
  const [patientLoading, setPatientLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  const [recommendations, setRecommendations] = useState([]);
  const [recPage, setRecPage] = useState(1);
  const [recTotal, setRecTotal] = useState(0);
  const [recLoading, setRecLoading] = useState(true);

  const [newRec, setNewRec] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const recTotalPages = Math.max(1, Math.ceil(recTotal / REC_PAGE_SIZE));

  const fetchPatient = useCallback(async () => {
    setPatientLoading(true);
    try {
      const data = await api.get(`/patient/${id}`);
      setPatient(data);
    } catch {
      try {
        const list = await api.get(`/patient/?page=1&size=100`);
        const found = (list.patients || []).find((p) => p.id === id);
        setPatient(found || null);
      } catch {
        setPatient(null);
      }
    } finally {
      setPatientLoading(false);
    }
  }, [id]);

  const fetchRecommendations = useCallback(
    async (p) => {
      setRecLoading(true);
      try {
        const data = await api.get(
          `/recommendation/?patient_id=${id}&page=${p}&size=${REC_PAGE_SIZE}`
        );
        setRecommendations(data.recommendations || []);
        setRecTotal(data.total || 0);
      } catch (err) {
        console.error("Failed to fetch recommendations:", err);
        setRecommendations([]);
        setRecTotal(0);
      } finally {
        setRecLoading(false);
      }
    },
    [id]
  );

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    if (patientFetched.current) return;
    patientFetched.current = true;
    fetchPatient();
  }, [user, authLoading, router, fetchPatient]);

  useEffect(() => {
    if (authLoading || !user) return;
    if (recFetched.current && recPage === 1) return;
    recFetched.current = true;
    fetchRecommendations(recPage);
  }, [recPage, user, authLoading, fetchRecommendations]);

  useEffect(() => {
    if (recPage > 1) recFetched.current = false;
  }, [recPage]);

  const handleDeletePatient = async () => {
    setDeleting(true);
    try {
      await api.delete(`/patient/${id}`);
      router.push("/patients");
    } catch (err) {
      console.error("Failed to delete patient:", err);
      setError("Не удалось удалить пациента. Попробуйте снова.");
      setDeleting(false);
    }
  };

  const handleSendRecommendation = async () => {
    const text = newRec.trim();
    if (!text) return;

    setSending(true);
    setError("");

    try {
      await api.post("/recommendation", {
        patient_id: id,
        patient_history: text,
      });
      setNewRec("");
      recFetched.current = false;
      setRecPage(1);
      await fetchRecommendations(1);
    } catch (err) {
      console.error("Failed to send recommendation:", err);

      if (err.status === 401) {
        setError("Сессия истекла. Войдите заново.");
      } else if (err.code === "LLMERROR") {
        setError(`Ошибка ИИ: ${err.message}`);
      } else if (err.status === 422) {
        setError(`Ошибка валидации: ${err.message}`);
      } else {
        setError("Не удалось сгенерировать рекомендацию. Попробуйте снова.");
      }
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleSendRecommendation();
    }
  };

  if (authLoading || patientLoading) return <PatientPageSkeleton />;

  if (!patient) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Button variant="ghost" onClick={() => router.push("/patients")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Назад к списку
        </Button>
        <div className="text-center py-20 text-muted-foreground">
          <p className="text-lg">Пациент не найден</p>
        </div>
      </div>
    );
  }

  const initials = patient.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const age = formatAge(patient.birth_date);
  const genderLabel = formatGender(patient.gender);
  const birthDateLabel = formatBirthDate(patient.birth_date);

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl space-y-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push("/patients")}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Назад к списку
      </Button>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-5">
              <div className="h-16 w-16 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xl flex-shrink-0">
                {initials}
              </div>
              <div>
                <h1 className="text-2xl font-bold">{patient.name}</h1>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  {genderLabel && (
                    <Badge variant="secondary">{genderLabel}</Badge>
                  )}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="outline">{birthDateLabel}</Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{age}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>

                <p className="text-xs text-muted-foreground font-mono mt-2">
                  ID: {patient.id}
                </p>
              </div>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex-shrink-0"
                  disabled={deleting}
                >
                  {deleting ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Trash2 className="h-5 w-5" />
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Удалить пациента?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Вы собираетесь удалить пациента{" "}
                    <span className="font-semibold text-foreground">
                      {patient.name}
                    </span>
                    . Это действие нельзя отменить. Все данные и рекомендации
                    будут удалены.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Отмена</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeletePatient}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Удалить
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 flex items-start gap-2">
          <span className="text-destructive text-sm">⚠</span>
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Добавить историю болезни и сгенерировать рекомендацию
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Опишите историю пациента..."
            value={newRec}
            onChange={(e) => setNewRec(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={4}
            disabled={sending}
            className="resize-none"
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Ctrl + Enter для отправки
            </p>
            <Button
              onClick={handleSendRecommendation}
              disabled={!newRec.trim() || sending}
            >
              {sending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Отправить
            </Button>
          </div>
        </CardContent>
      </Card>

      <Separator />
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Рекомендации</h2>
          {recTotal > 0 && (
            <Badge variant="secondary">
              {recPage} / {recTotalPages} · Всего: {recTotal}
            </Badge>
          )}
        </div>

        {recLoading ? (
          <RecommendationsSkeleton />
        ) : recommendations.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12 text-muted-foreground">
              <FileText className="mx-auto h-10 w-10 mb-3 opacity-50" />
              <p>Рекомендаций пока нет</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {recommendations.map((rec) => (
              <RecommendationCard key={rec.id} recommendation={rec} />
            ))}
          </div>
        )}

        {recTotalPages > 1 && (
          <div className="flex items-center justify-center gap-4 pt-2">
            <Button
              variant="outline"
              size="sm"
              disabled={recPage <= 1 || recLoading}
              onClick={() => setRecPage((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Назад
            </Button>
            <span className="text-sm text-muted-foreground">
              {recPage} / {recTotalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={recPage >= recTotalPages || recLoading}
              onClick={() => setRecPage((p) => p + 1)}
            >
              Вперёд
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function RecommendationCard({ recommendation }) {
  const { patient_history, thresholds } = recommendation;

  return (
    <Card className="transition-colors hover:bg-muted/30">
      <CardContent className="p-5 space-y-4">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
            История
          </p>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {patient_history}
          </p>
        </div>

        {thresholds && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <ThresholdBadge
              icon={<Activity className="h-4 w-4" />}
              label="Систолическое АД"
              min={thresholds.systolic_blood_pressure_min}
              max={thresholds.systolic_blood_pressure_max}
              unit="мм рт.ст."
            />
            <ThresholdBadge
              icon={<Heart className="h-4 w-4" />}
              label="Диастолическое АД"
              min={thresholds.diastolic_blood_pressure_min}
              max={thresholds.diastolic_blood_pressure_max}
              unit="мм рт.ст."
            />
            <ThresholdBadge
              icon={<Thermometer className="h-4 w-4" />}
              label="Температура"
              min={thresholds.temperature_celsius_min.toFixed(1)}
              max={thresholds.temperature_celsius_max.toFixed(1)}
              unit="°C"
            />
          </div>
        )}

        <p className="text-xs text-muted-foreground font-mono">
          {recommendation.id.slice(0, 8)}…
        </p>
      </CardContent>
    </Card>
  );
}

function ThresholdBadge({ icon, label, min, max, unit }) {
  return (
    <div className="rounded-lg border bg-muted/40 p-3 space-y-1">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="text-sm font-semibold">
        {min} – {max}{" "}
        <span className="text-xs font-normal text-muted-foreground">
          {unit}
        </span>
      </p>
    </div>
  );
}

function PatientPageSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl space-y-6">
      <Skeleton className="h-8 w-40" />
      <Card>
        <CardContent className="flex items-center gap-5 p-6">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-48" />
            <div className="flex gap-2">
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-4 w-64" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-6 space-y-4">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-9 w-32 ml-auto" />
        </CardContent>
      </Card>
    </div>
  );
}

function RecommendationsSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-5 space-y-3">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <div className="grid grid-cols-3 gap-3">
              <Skeleton className="h-16 rounded-lg" />
              <Skeleton className="h-16 rounded-lg" />
              <Skeleton className="h-16 rounded-lg" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
