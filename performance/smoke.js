import http from 'k6/http';
import { check } from 'k6';

// Smoke test: carga minima, so pra validar que o alvo responde e o script esta sao.
// Deve rodar antes de qualquer teste maior. Se o smoke falha, nao faz sentido medir carga.

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export const options = {
  vus: 1,
  duration: '15s',
  thresholds: {
    http_req_failed: ['rate<0.01'],     // menos de 1% de falha
    http_req_duration: ['p(95)<500'],   // 95% das respostas abaixo de 500ms
  },
};

export default function () {
  const res = http.get(`${BASE_URL}/`);
  check(res, { 'home responde 200': (r) => r.status === 200 });
}
