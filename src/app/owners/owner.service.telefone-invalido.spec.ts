import { TestBed } from '@angular/core/testing';
import { provideHttpClient, HttpErrorResponse } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { throwError } from 'rxjs';
import { OwnerService } from './owner.service';
import { Owner } from './owner';
import { HttpErrorHandler } from '../error.service';
import { environment } from '../../environments/environment';

// RN-008: telefone com tamanho diferente de 8 e 10 dígitos, ou com caractere que não seja dígito nem máscara, é recusado com 400 e mensagem (SPEC-001 seção 2.1, C6)
// O tratador de erro é substituído por um que repassa o erro, para o teste enxergar o 400 e a mensagem do servidor.
describe('OwnerService · busca por telefone inválido devolve 400 com mensagem', () => {
  let service: OwnerService;
  let httpMock: HttpTestingController;

  const mensagem = 'O telefone deve ter 8 ou 10 dígitos';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        OwnerService,
        {
          provide: HttpErrorHandler,
          useValue: {
            createHandleError: () => () => (erro: unknown) => throwError(() => erro)
          }
        },
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(OwnerService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  // @verifica: CT-121
  it('RN-008 · telefone com 9 dígitos devolve 400 com a mensagem de 8 ou 10 dígitos', () => {
    let erroRecebido: HttpErrorResponse | undefined;
    let listaRecebida: Owner[] | undefined;

    (service as any).searchOwnersByPhone('608555102').subscribe({
      next: (lista: Owner[]) => { listaRecebida = lista; },
      error: (erro: HttpErrorResponse) => { erroRecebido = erro; }
    });

    const req = httpMock.expectOne(r =>
      r.url === environment.REST_API_URL + 'owners' && r.urlWithParams.includes('telefone=608555102'));
    expect(req.request.method).toBe('GET');
    expect(req.request.urlWithParams).not.toContain('lastName');
    req.flush({ message: mensagem }, { status: 400, statusText: 'Bad Request' });

    expect(listaRecebida).toBeUndefined();
    expect(erroRecebido).toBeDefined();
    expect(erroRecebido!.status).toBe(400);
    expect(erroRecebido!.error.message).toContain('8 ou 10');
  });

  // @verifica: CT-121
  it('RN-008 · telefone com 11 dígitos devolve 400 com mensagem que cita o tamanho esperado', () => {
    let erroRecebido: HttpErrorResponse | undefined;

    (service as any).searchOwnersByPhone('60855510231').subscribe({
      next: () => { /* não deve entregar lista */ },
      error: (erro: HttpErrorResponse) => { erroRecebido = erro; }
    });

    const req = httpMock.expectOne(r => r.urlWithParams.includes('telefone=60855510231'));
    req.flush({ message: mensagem }, { status: 400, statusText: 'Bad Request' });

    expect(erroRecebido).toBeDefined();
    expect(erroRecebido!.status).toBe(400);
    expect(erroRecebido!.error.message).toBe(mensagem);
  });
});
