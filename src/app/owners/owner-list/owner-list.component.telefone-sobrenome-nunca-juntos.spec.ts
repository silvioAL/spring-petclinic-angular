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

// RN-018 / RN-008: telefone e sobrenome nunca vao na mesma chamada (SPEC-002 secao 2.1, C3)
describe('OwnerListComponent · telefone e sobrenome nunca vao na mesma chamada', () => {
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

  // @verifica: CT-133
  it('RN-018 · texto so com digitos chama so a busca por telefone, sem sobrenome', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    component.searchByLastName('(608) 555-1023');
    await fixture.whenStable();
    fixture.detectChanges();

    expect(buscaPorTelefone).toHaveBeenCalledTimes(1);
    expect(buscaPorTelefone).toHaveBeenCalledWith('6085551023');
    expect(buscaPorSobrenome).not.toHaveBeenCalled();
  });

  // @verifica: CT-133
  it('RN-018 · texto com letras e numeros chama so a busca por sobrenome, sem telefone', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    component.searchByLastName('Franklin6085');
    await fixture.whenStable();
    fixture.detectChanges();

    expect(buscaPorSobrenome).toHaveBeenCalledTimes(1);
    expect(buscaPorSobrenome).toHaveBeenCalledWith('Franklin6085');
    expect(buscaPorTelefone).not.toHaveBeenCalled();
  });

  // @verifica: CT-133
  it('RN-018 · busca por sobrenome e depois por telefone nunca mistura os dois na mesma chamada', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    component.searchByLastName('Franklin');
    await fixture.whenStable();
    fixture.detectChanges();

    component.searchByLastName('6085551023');
    await fixture.whenStable();
    fixture.detectChanges();

    expect(buscaPorSobrenome).toHaveBeenCalledTimes(1);
    expect(buscaPorSobrenome).toHaveBeenCalledWith('Franklin');
    expect(buscaPorTelefone).toHaveBeenCalledTimes(1);
    expect(buscaPorTelefone).toHaveBeenCalledWith('6085551023');
  });
});
