import http from 'k6/http';
import { check } from 'k6';
import { Counter } from 'k6/metrics';

// Sonda de rate limiting no login. Dispara uma rajada de tentativas de login
// invalido e conta as respostas. Se o servidor nunca responde 429 (Too Many
// Requests), nao existe rate limiting, e o endpoint fica exposto a brute force
// e credential stuffing. Relacionado a OWASP A07, Identification and
// Authentication Failures.
//
// O threshold abaixo documenta a EXPECTATIVA de seguranca: queremos ver bloqueio.
// Se ele falhar, a propria falha e a evidencia da ausencia de protecao.

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

const bloqueadas429 = new Counter('login_429_bloqueado');
const aceitas401 = new Counter('login_401_tentativa_processada');

export const options = {
  scenarios: {
    rajada_de_login: {
      executor: 'constant-arrival-rate',
      rate: 50,                // 50 tentativas por segundo
      timeUnit: '1s',
      duration: '15s',         // cerca de 750 tentativas no total
      preAllocatedVUs: 50,
    },
  },
  thresholds: {
    login_429_bloqueado: ['count>0'],   // esperamos pelo menos um 429; a ausencia e o achado
  },
};

export default function () {
  const res = http.post(
    `${BASE_URL}/rest/user/login`,
    JSON.stringify({ email: 'admin@juice-sh.op', password: `senha-errada-${__VU}-${__ITER}` }),
    { headers: { 'Content-Type': 'application/json' } },
  );

  if (res.status === 429) bloqueadas429.add(1);
  if (res.status === 401) aceitas401.add(1);

  check(res, { 'servidor respondeu, nao caiu': (r) => r.status !== 0 });
}
