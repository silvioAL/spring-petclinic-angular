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

// RN-018: busca por sobrenome sem resultado mantem o aviso de lista vazia que a tela ja tem (SPEC-002 secao 2.1, C5)
describe('OwnerListComponent · busca por sobrenome sem resultado mantem o aviso atual', () => {
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
    // sem resultado por sobrenome: a API responde 404, como a tela trata hoje
    buscaPorSobrenome = vi.spyOn(ownerService, 'searchOwners').mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 404 }))
    );
  });

  // @verifica: CT-134
  it('RN-018 · sobrenome sem resultado mostra o aviso de lista vazia atual e nao o aviso de telefone', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    component.searchByLastName('Inexistente');
    await fixture.whenStable();
    fixture.detectChanges();

    expect(buscaPorSobrenome).toHaveBeenCalledWith('Inexistente');
    expect(buscaPorTelefone).not.toHaveBeenCalled();

    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('No owners with LastName starting with');
    expect(texto).not.toContain('Nenhum dono tem esse telefone');
    expect(fixture.nativeElement.querySelector('#ownersTable')).toBeNull();
  });
});
