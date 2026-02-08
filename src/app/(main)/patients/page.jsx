"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/context/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight, User } from "lucide-react";

const PAGE_SIZE = 12;

export default function PatientsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const fetchedRef = useRef(false);

  const [patients, setPatients] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const fetchPatients = useCallback(async (p) => {
    setLoading(true);
    try {
      const data = await api.get(`/patient/?page=${p}&size=${PAGE_SIZE}`);
      setPatients(data.patients || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error("Failed to fetch patients:", err);
      setPatients([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }

    // Защита от двойного вызова в Strict Mode
    if (fetchedRef.current && page === 1) return;
    fetchedRef.current = true;

    fetchPatients(page);
  }, [page, user, authLoading, router, fetchPatients]);

  useEffect(() => {
    if (page > 1) fetchedRef.current = false;
  }, [page]);

  if (authLoading) return <PatientsGridSkeleton />;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Пациенты</h1>
        {!loading && total > 0 && (
          <span className="text-sm text-muted-foreground">
            Всего: {total}
          </span>
        )}
      </div>

      {loading ? (
        <PatientsGridSkeleton />
      ) : patients.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <User className="mx-auto h-12 w-12 mb-4 opacity-50" />
          <p className="text-lg">Пациенты не найдены</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {patients.map((patient) => (
              <PatientCard
                key={patient.id}
                patient={patient}
                onClick={() => router.push(`/patients/${patient.id}`)}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-8">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Назад
              </Button>
              <span className="text-sm text-muted-foreground font-medium">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Вперёд
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function PatientCard({ patient, onClick }) {
  const initials = patient.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Card
      className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] hover:border-primary/50 active:scale-[0.98]"
      onClick={onClick}
    >
      <CardContent className="flex items-center gap-4 p-5">
        <div className="flex-shrink-0 h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm">
          {initials}
        </div>
        <div className="min-w-0">
          <p className="font-medium truncate">{patient.name}</p>
          <p className="text-xs text-muted-foreground truncate font-mono">
            {patient.id.slice(0, 8)}…
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function PatientsGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="flex items-center gap-4 p-5">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
