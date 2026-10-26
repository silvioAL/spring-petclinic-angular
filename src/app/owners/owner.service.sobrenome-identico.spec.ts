import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';

import { OwnerService } from './owner.service';
import { Owner } from './owner';
import { HttpErrorHandler } from '../error.service';

// RN-018: a chamada por sobrenome segue identica apos o parametro novo de telefone (SPEC-002 secao 2.1, C2 e C3)
describe('OwnerService · chamada por sobrenome segue identica apos o parametro novo', () => {
  let service: OwnerService;
  let httpMock: HttpTestingController;

  const donoEncontrado: Owner = {
    id: 1,
    firstName: 'George',
    lastName: 'Franklin',
    address: '110 W. Liberty St.',
    city: 'Madison',
    telephone: '6085551023',
    pets: null
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        OwnerService,
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: HttpErrorHandler,
          useValue: { createHandleError: () => (_operacao: string, resultado: unknown) => () => of(resultado) }
        }
      ]
    });
    service = TestBed.inject(OwnerService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  // @verifica: CT-138
  it('RN-018 · busca por sobrenome chama GET owners so com o parametro lastName, sem o parametro telefone', () => {
    let recebidos: Owner[] | undefined;
    service.searchOwners('Franklin').subscribe(donos => (recebidos = donos));

    const requisicao = httpMock.expectOne(req => req.url.startsWith(service.entityUrl));
    expect(requisicao.request.method).toBe('GET');
    expect(requisicao.request.urlWithParams).toBe(service.entityUrl + '?lastName=Franklin');
    expect(requisicao.request.urlWithParams).not.toContain('telefone');
    requisicao.flush([donoEncontrado]);

    expect(recebidos).toEqual([donoEncontrado]);
  });

  // @verifica: CT-138
  it('RN-018 · a busca por telefone usa o parametro telefone e nunca o lastName, deixando a de sobrenome como esta', () => {
    let recebidos: Owner[] | undefined;
    (service as any)
      .searchOwnersByTelephone('6085551023')
      .subscribe((donos: Owner[]) => (recebidos = donos));

    const requisicao = httpMock.expectOne(req => req.url.startsWith(service.entityUrl));
    expect(requisicao.request.method).toBe('GET');
    expect(requisicao.request.urlWithParams).toBe(service.entityUrl + '?telefone=6085551023');
    expect(requisicao.request.urlWithParams).not.toContain('lastName');
    requisicao.flush([donoEncontrado]);

    expect(recebidos).toEqual([donoEncontrado]);
  });
});
