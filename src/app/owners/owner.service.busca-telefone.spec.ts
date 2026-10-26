import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { OwnerService } from './owner.service';
import { Owner } from './owner';
import { HttpErrorHandler } from '../error.service';
import { environment } from '../../environments/environment';

// RN-008 / RN-018: a busca de donos por telefone usa a mesma listagem de hoje (SPEC-001 seção 2.1, SPEC-002 seção 2.1)
describe('OwnerService · busca por telefone devolve 200 no formato de hoje', () => {
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
    },
    {
      id: 2,
      firstName: 'Betty',
      lastName: 'Davis',
      address: '638 Cardinal Ave.',
      city: 'Sun Prairie',
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

  // @verifica: CT-120
  it('RN-008 · busca por telefone chama GET owners?telefone e devolve a lista de donos no formato de hoje', () => {
    let recebidos: Owner[] | undefined;

    (service as any).searchOwnersByPhone('6085551023').subscribe((lista: Owner[]) => {
      recebidos = lista;
    });

    const req = httpMock.expectOne(r =>
      r.url === environment.REST_API_URL + 'owners' && r.urlWithParams.includes('telefone=6085551023'));
    expect(req.request.method).toBe('GET');
    expect(req.request.urlWithParams).not.toContain('lastName');
    req.flush(donos, { status: 200, statusText: 'OK' });

    expect(recebidos).toEqual(donos);
    expect(recebidos!.length).toBe(2);
    expect(Object.keys(recebidos![0]).sort()).toEqual(
      ['address', 'city', 'firstName', 'id', 'lastName', 'pets', 'telephone']);
  });

  // @verifica: CT-120
  it('RN-008 · busca por telefone sem donos devolve 200 com lista vazia', () => {
    let recebidos: Owner[] | undefined;

    (service as any).searchOwnersByPhone('60855510').subscribe((lista: Owner[]) => {
      recebidos = lista;
    });

    const req = httpMock.expectOne(r => r.urlWithParams.includes('telefone=60855510'));
    req.flush([], { status: 200, statusText: 'OK' });

    expect(recebidos).toEqual([]);
  });
});
