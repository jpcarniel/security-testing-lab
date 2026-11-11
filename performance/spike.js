import http from 'k6/http';
import { check } from 'k6';

// Spike test: simula um pico súbito e curto de tráfego, como uma promoção que viraliza,
// e observa duas coisas: se o sistema aguenta o golpe e se ele volta ao normal depois
// que o pico passa. A recuperação importa tanto quanto o pico.

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export const options = {
  stages: [
    { duration: '10s', target: 10 },    // tráfego normal
    { duration: '5s', target: 200 },    // pico súbito
    { duration: '20s', target: 200 },   // sustenta o pico
    { duration: '5s', target: 10 },     // despenca de volta
    { duration: '10s', target: 10 },    // janela pra observar a recuperação
    { duration: '5s', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.15'],      // durante o pico, até 15% de erro é tolerado
  },
};

export default function () {
  const res = http.get(`${BASE_URL}/`);
  check(res, { 'home respondeu durante o pico': (r) => r.status === 200 });
}
