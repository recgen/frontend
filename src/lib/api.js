class ApiClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`

    const config = {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    }

    const res = await fetch(url, config)

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      const error = new ApiError(
        res.status,
        body.detail || body.reason || 'Непредвиденная ошибка',
        body.code || null,
        body
      )
      throw error
    }

    if (res.status === 204) return {}
    return res.json()
  }

  get(endpoint) {
    return this.request(endpoint)
  }

  post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  patch(endpoint, data) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' })
  }
}

class ApiError extends Error {
  constructor(status, message, code = null, body = {}) {
    super(message)
    this.status = status
    this.code = code       
    this.body = body      
    this.name = 'ApiError'
  }
}

export { ApiError }
export const api = new ApiClient('/api')
