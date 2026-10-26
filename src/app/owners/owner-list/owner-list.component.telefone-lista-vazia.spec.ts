import type { Mock } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { Observable, of } from 'rxjs';

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

// RN-008 / RN-018: busca por telefone sem resultado vira lista vazia com aviso na tela, nao erro (SPEC-001 C5, SPEC-002 secao 2.1 e C4)
describe('OwnerListComponent · sem resultado na busca por telefone vira lista vazia com aviso na tela', () => {
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
    buscaPorTelefone = vi.spyOn(ownerService, 'searchOwnersByTelephone').mockReturnValue(of([]));
    buscaPorSobrenome = vi.spyOn(ownerService, 'searchOwners').mockReturnValue(of([]));
  });

  // @verifica: CT-137
  it('RN-008 · telefone com 10 digitos sem nenhum dono deixa a lista vazia e mostra o aviso', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    component.searchByLastName('6085559999');
    await fixture.whenStable();
    fixture.detectChanges();

    expect(buscaPorTelefone).toHaveBeenCalledWith('6085559999');
    expect(buscaPorSobrenome).not.toHaveBeenCalled();

    const raiz = fixture.nativeElement as HTMLElement;
    const texto = raiz.textContent ?? '';
    expect(texto).toContain('Nenhum dono tem esse telefone');
    expect(raiz.querySelectorAll('tbody tr').length).toBe(0);
    expect(raiz.querySelector('.alert-danger')).toBeNull();
  });

  // @verifica: CT-137
  it('RN-008 · telefone com 8 digitos sem nenhum dono deixa a lista vazia e mostra o aviso', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    component.searchByLastName('60855599');
    await fixture.whenStable();
    fixture.detectChanges();

    expect(buscaPorTelefone).toHaveBeenCalledWith('60855599');
    expect(buscaPorSobrenome).not.toHaveBeenCalled();

    const raiz = fixture.nativeElement as HTMLElement;
    const texto = raiz.textContent ?? '';
    expect(texto).toContain('Nenhum dono tem esse telefone');
    expect(raiz.querySelectorAll('tbody tr').length).toBe(0);
  });
});
