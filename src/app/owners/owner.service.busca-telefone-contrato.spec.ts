import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { OwnerService } from './owner.service';
import { Owner } from './owner';
import { HttpErrorHandler } from '../error.service';
import { environment } from '../../environments/environment';

// RN-008 / RN-018: a busca por telefone consome GET /petclinic/api/owners com o parametro telefone (SPEC-002 secao 2.1)
describe('OwnerService · busca por telefone chama GET owners com o parametro telefone', () => {
  let service: OwnerService;
  let httpMock: HttpTestingController;

  const donos = [
    {
      id: 1,
      firstName: 'George',
      lastName: 'Franklin',
      address: '110 W. Liberty St.',
      city: 'Madison',
      telephone: '6085551023',
      pets: []
    }
  ] as unknown as Owner[];

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

  // @verifica: CT-135
  it('RN-008 · busca por telefone faz GET em owners com telefone=<digitos> e responde a lista de donos', () => {
    let recebidos: Owner[] | undefined;

    (service as any).searchOwnersByPhone('6085551023').subscribe((lista: Owner[]) => {
      recebidos = lista;
    });

    const req = httpMock.expectOne(r =>
      r.url === environment.REST_API_URL + 'owners' && r.urlWithParams.includes('telefone=6085551023'));
    expect(req.request.method).toBe('GET');
    req.flush(donos, { status: 200, statusText: 'OK' });

    expect(recebidos).toEqual(donos);
  });

  // @verifica: CT-135
  it('RN-008 · busca por telefone nao envia o parametro de sobrenome na mesma chamada', () => {
    (service as any).searchOwnersByPhone('60855510').subscribe();

    const req = httpMock.expectOne(r => r.urlWithParams.includes('telefone=60855510'));
    expect(req.request.method).toBe('GET');
    expect(req.request.urlWithParams).not.toContain('lastName');
    req.flush([], { status: 200, statusText: 'OK' });
  });
});
