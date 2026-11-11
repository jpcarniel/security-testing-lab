import http from 'k6/http';
import { check } from 'k6';

// Stress test: empurra a carga bem além do esperado, em degraus crescentes, pra achar
// o ponto onde a latência dispara ou os erros começam. O load mede o dia normal; o
// stress procura o limite e mostra como o sistema se comporta perto dele.

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export const options = {
  stages: [
    { duration: '20s', target: 50 },
    { duration: '20s', target: 100 },
    { duration: '20s', target: 200 },
    { duration: '10s', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.10'],      // sob stress, até 10% de erro é tolerado
    http_req_duration: ['p(95)<3000'],   // p95 abaixo de 3s no limite
  },
};

export default function () {
  const res = http.get(`${BASE_URL}/rest/products/search?q=apple`);
  check(res, { 'busca respondeu 200': (r) => r.status === 200 });
}
