import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { OwnerService } from './owner.service';
import { Owner } from './owner';
import { HttpErrorHandler } from '../error.service';
import { environment } from '../../environments/environment';

// RN-001 / RN-004: a busca por telefone herda o controle de acesso da busca de donos
// (SPEC-001 seção 2.1 e C7): 401 e 403 são tratados como na busca por sobrenome,
// sem permissão nova e sem tratamento próprio
describe('OwnerService · busca por telefone herda o controle de acesso da busca de donos', () => {
  let service: OwnerService;
  let httpMock: HttpTestingController;
  let tratados: Array<{ operacao: string; resultado: unknown }>;

  beforeEach(() => {
    tratados = [];
    TestBed.configureTestingModule({
      providers: [
        OwnerService,
        {
          provide: HttpErrorHandler,
          useValue: {
            createHandleError: () => (operacao: string) => (resultado: unknown) => () => {
              tratados.push({ operacao, resultado });
              return of(resultado);
            }
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

  // @verifica: CT-139
  it('RN-001 · busca por telefone sem credencial (401) é tratada como a busca por sobrenome', () => {
    let porSobrenome: Owner[] | undefined;
    let porTelefone: Owner[] | undefined;

    service.searchOwners('Franklin').subscribe((lista: Owner[]) => (porSobrenome = lista));
    httpMock
      .expectOne(r => r.url === environment.REST_API_URL + 'owners' && r.urlWithParams.includes('lastName=Franklin'))
      .flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

    (service as any).searchOwnersByPhone('6085551023').subscribe((lista: Owner[]) => (porTelefone = lista));
    httpMock
      .expectOne(r => r.url === environment.REST_API_URL + 'owners' && r.urlWithParams.includes('telefone=6085551023'))
      .flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

    expect(porTelefone).toEqual(porSobrenome);
    expect(tratados.length).toBe(2);
    expect(tratados[1].resultado).toEqual(tratados[0].resultado);
  });

  // @verifica: CT-139
  it('RN-004 · busca por telefone com papel sem permissão (403) é tratada como a busca por sobrenome', () => {
    let porSobrenome: Owner[] | undefined;
    let porTelefone: Owner[] | undefined;

    service.searchOwners('Franklin').subscribe((lista: Owner[]) => (porSobrenome = lista));
    httpMock
      .expectOne(r => r.url === environment.REST_API_URL + 'owners' && r.urlWithParams.includes('lastName=Franklin'))
      .flush('Forbidden', { status: 403, statusText: 'Forbidden' });

    (service as any).searchOwnersByPhone('60855510').subscribe((lista: Owner[]) => (porTelefone = lista));
    httpMock
      .expectOne(r => r.url === environment.REST_API_URL + 'owners' && r.urlWithParams.includes('telefone=60855510'))
      .flush('Forbidden', { status: 403, statusText: 'Forbidden' });

    expect(porTelefone).toEqual(porSobrenome);
    expect(tratados.length).toBe(2);
    expect(tratados[1].resultado).toEqual(tratados[0].resultado);
  });

  // @verifica: CT-139
  it('RN-001 · busca por telefone usa a mesma operação GET owners da busca de donos, sem exigir permissão extra', () => {
    (service as any).searchOwnersByPhone('6085551023').subscribe();

    const req = httpMock.expectOne(r => r.url === environment.REST_API_URL + 'owners');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('telefone') ?? req.request.urlWithParams.includes('telefone=6085551023')).toBeTruthy();
    expect(req.request.headers.keys().filter(k => k.toLowerCase().startsWith('x-'))).toEqual([]);
    req.flush([], { status: 200, statusText: 'OK' });
  });
});
