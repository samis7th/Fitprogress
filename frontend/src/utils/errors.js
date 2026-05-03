export function getApiErrorMessage(error, fallback = "Não foi possível concluir a ação.") {
  return error.response?.data?.detail || error.message || fallback;
}
