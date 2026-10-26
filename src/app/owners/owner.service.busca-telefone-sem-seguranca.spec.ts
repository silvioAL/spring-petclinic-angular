import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { OwnerService } from './owner.service';
import { Owner } from './owner';
import { HttpErrorHandler } from '../error.service';
import { environment } from '../../environments/environment';

// RN-001 / RN-004: a busca por telefone herda o controle de acesso da busca de donos;
// com a segurança desligada ela não exige autenticação (SPEC-001 seção 2.1, C7)
describe('OwnerService · busca por telefone sem segurança ligada não exige autenticação', () => {
  let service: OwnerService;
  let httpMock: HttpTestingController;

  const dono = {
    id: 1,
    firstName: 'George',
    lastName: 'Franklin',
    address: '110 W. Liberty St.',
    city: 'Madison',
    telephone: '6085551023',
    pets: []
  } as unknown as Owner;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        OwnerService,
        {
          provide: HttpErrorHandler,
          useValue: {
            createHandleError: () => () => (result: unknown) => () => of(result)
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

  // @verifica: CT-119
  it('RN-001 · busca por telefone sem credencial é enviada sem cabeçalho de autenticação e devolve 200', () => {
    let recebidos: Owner[] | undefined;

    (service as any).searchOwnersByPhone('6085551023').subscribe((lista: Owner[]) => {
      recebidos = lista;
    });

    const req = httpMock.expectOne(r =>
      r.url === environment.REST_API_URL + 'owners' && r.urlWithParams.includes('telefone=6085551023'));
    expect(req.request.method).toBe('GET');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    expect(req.request.withCredentials).toBeFalse();
    req.flush([dono], { status: 200, statusText: 'OK' });

    expect(recebidos).toEqual([dono]);
  });

  // @verifica: CT-119
  it('RN-004 · busca por telefone com segurança desligada não é tratada como acesso negado', () => {
    let recebidos: Owner[] | undefined;

    (service as any).searchOwnersByPhone('60855510').subscribe((lista: Owner[]) => {
      recebidos = lista;
    });

    const req = httpMock.expectOne(r => r.urlWithParams.includes('telefone=60855510'));
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush([dono], { status: 200, statusText: 'OK' });

    expect(recebidos).toEqual([dono]);
    expect(recebidos!.length).toBe(1);
  });
});
