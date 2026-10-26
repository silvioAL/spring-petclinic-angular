import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';

import { OwnerService } from './owner.service';
import { Owner } from './owner';
import { HttpErrorHandler } from '../error.service';
import { environment } from '../../environments/environment';

// Trata o erro HTTP devolvendo o valor padrao, sem depender do servico de mensagens real.
const httpErrorHandlerStub = {
    createHandleError: () => (_operation: string, result: unknown) => () => of(result)
};

describe('OwnerService - busca por telefone sem seguranca ligada', () => {

    let ownerService: OwnerService;
    let httpMock: HttpTestingController;

    const testOwner: Owner = {
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
                provideHttpClient(),
                provideHttpClientTesting(),
                OwnerService,
                { provide: HttpErrorHandler, useValue: httpErrorHandlerStub }
            ]
        });
        ownerService = TestBed.inject(OwnerService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpMock.verify();
    });

    // @verifica: CT-119
    it('RN-001 · busca por telefone sem seguranca ligada nao exige autenticacao', () => {
        let recebidos: Owner[] | undefined;

        ownerService.searchOwnersByTelephone('6085551023').subscribe(owners => recebidos = owners);

        const req = httpMock.expectOne(r => r.url === environment.REST_API_URL + 'owners');
        expect(req.request.method).toBe('GET');
        expect(req.request.params.get('telefone')).toBe('6085551023');
        expect(req.request.params.has('lastName')).toBe(false);
        // sem credencial: nenhum cabecalho de autenticacao e nenhum envio de cookies de sessao
        expect(req.request.headers.has('Authorization')).toBe(false);
        expect(req.request.withCredentials).toBe(false);

        req.flush([testOwner]);
        expect(recebidos).toEqual([testOwner]);
    });
});
