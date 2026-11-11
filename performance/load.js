import http from 'k6/http';
import { check, sleep } from 'k6';

// Load test: rampa ate 30 usuarios virtuais navegando como um usuario real
// (home, catalogo, busca) pra medir latencia e taxa de erro sob carga sustentada.
// Os thresholds representam o SLO desejado; se forem violados, o teste falha.

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export const options = {
  stages: [
    { duration: '20s', target: 30 },   // sobe ate 30 VUs
    { duration: '40s', target: 30 },   // mantem a carga
    { duration: '10s', target: 0 },    // desce
  ],
  thresholds: {
    http_req_failed: ['rate<0.05'],      // menos de 5% de falha sob carga
    http_req_duration: ['p(95)<1500'],   // p95 abaixo de 1.5s
  },
};

export default function () {
  // Simula a jornada de um usuario navegando pela loja.
  http.get(`${BASE_URL}/`);
  const catalogo = http.get(`${BASE_URL}/api/Products`);
  check(catalogo, { 'catalogo 200': (r) => r.status === 200 });

  const busca = http.get(`${BASE_URL}/rest/products/search?q=apple`);
  check(busca, { 'busca 200': (r) => r.status === 200 });

  sleep(1); // think time entre as acoes, aproxima o comportamento humano
}
