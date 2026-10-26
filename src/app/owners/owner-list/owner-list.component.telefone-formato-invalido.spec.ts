import type { Mock } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';

import { OwnerListComponent } from './owner-list.component';
import { OwnerService } from '../owner.service';
import { Owner } from '../owner';
import { PartsModule } from '../../parts/parts.module';
import { ActivatedRouteStub } from '../../testing/router-stubs';
import { DummyComponent } from '../../testing/dummy.component';
import { OwnersModule } from '../owners.module';
import { OwnerDetailComponent } from '../owner-detail/owner-detail.component';
import { OwnerAddComponent } from '../owner-add/owner-add.component';
import { OwnerEditComponent } from '../owner-edit/owner-edit.component';

class OwnerServiceStub {
  getOwners(): Observable<Owner[]> {
    return of([]);
  }

  searchOwners(lastName: string): Observable<Owner[]> {
    return of([]);
  }

  searchOwnersByTelephone(telephone: string): Observable<Owner[]> {
    return of([]);
  }
}

const MENSAGEM_DO_SERVIDOR = 'O telefone deve ter 8 ou 10 digitos';

// RN-008: formato invalido (11 digitos) vira 400 no servidor e a tela exibe a mensagem recebida (SPEC-001 secao 2.1, SPEC-002 C6)
describe('OwnerListComponent · formato invalido devolve 400 e a tela exibe a mensagem recebida', () => {
  let component: OwnerListComponent;
  let fixture: ComponentFixture<OwnerListComponent>;
  let ownerService: OwnerServiceStub;
  let buscaPorTelefone: Mock;
  let buscaPorSobrenome: Mock;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DummyComponent],
      schemas: [NO_ERRORS_SCHEMA],
      imports: [CommonModule, FormsModule, PartsModule, OwnersModule],
      providers: [
        provideRouter([
          { path: 'owners', component: OwnerListComponent },
          { path: 'owners/add', component: OwnerAddComponent },
          { path: 'owners/:id', component: OwnerDetailComponent },
          { path: 'owners/:id/edit', component: OwnerEditComponent }
        ]),
        { provide: OwnerService, useClass: OwnerServiceStub },
        { provide: ActivatedRoute, useClass: ActivatedRouteStub }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(OwnerListComponent);
    component = fixture.componentInstance;
    ownerService = fixture.debugElement.injector.get(OwnerService) as unknown as OwnerServiceStub;
    vi.spyOn(ownerService, 'getOwners').mockReturnValue(of([]));
    buscaPorSobrenome = vi.spyOn(ownerService, 'searchOwners').mockReturnValue(of([]));
    buscaPorTelefone = vi.spyOn(ownerService, 'searchOwnersByTelephone').mockReturnValue(
      throwError(() => new HttpErrorResponse({
        status: 400,
        statusText: 'Bad Request',
        error: { message: MENSAGEM_DO_SERVIDOR }
      }))
    );
  });

  // @verifica: CT-136
  it('RN-008 · telefone de 11 digitos recebe 400 e a tela exibe a mensagem recebida junto ao campo', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    component.searchByLastName('60855599912');
    await fixture.whenStable();
    fixture.detectChanges();

    expect(buscaPorTelefone).toHaveBeenCalledWith('60855599912');
    expect(buscaPorSobrenome).not.toHaveBeenCalled();

    const campo = (fixture.nativeElement as HTMLElement).querySelector('#lastNameGroup');
    expect(campo).not.toBeNull();
    expect(campo?.textContent ?? '').toContain(MENSAGEM_DO_SERVIDOR);
  });

  // @verifica: CT-136
  it('RN-008 · numero com mascara e formato invalido envia so os digitos e exibe a mensagem recebida', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    component.searchByLastName('(608) 555-9991');
    await fixture.whenStable();
    fixture.detectChanges();

    expect(buscaPorTelefone).toHaveBeenCalledWith('6085559991');
    expect(buscaPorSobrenome).not.toHaveBeenCalled();

    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain(MENSAGEM_DO_SERVIDOR);
    expect(texto).not.toContain('Nenhum dono tem esse telefone');
    expect((fixture.nativeElement as HTMLElement).querySelector('#search-owner-form')).not.toBeNull();
  });
});
