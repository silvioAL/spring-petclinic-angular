import type { Mock } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
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

// RN-018 / RN-008: texto com letras e numeros misturados e tratado como sobrenome; so digitos (com ou sem mascara) e telefone (SPEC-002 secao 2.1, C1 e C2)
describe('OwnerListComponent · texto com letras e numeros e tratado como sobrenome', () => {
  let component: OwnerListComponent;
  let fixture: ComponentFixture<OwnerListComponent>;
  let ownerService: OwnerServiceStub;
  let buscaPorTelefone: Mock;
  let buscaPorSobrenome: Mock;

  const donoPorSobrenome: Owner = {
    id: 1,
    firstName: 'George',
    lastName: 'Franklin2',
    address: '110 W. Liberty St.',
    city: 'Madison',
    telephone: '6085551023',
    pets: null
  };

  const donoPorTelefone: Owner = {
    id: 2,
    firstName: 'Betty',
    lastName: 'Davis',
    address: '638 Cardinal Ave.',
    city: 'Sun Prairie',
    telephone: '6085551023',
    pets: null
  };

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
    buscaPorTelefone = vi.spyOn(ownerService, 'searchOwnersByTelephone').mockReturnValue(of([donoPorTelefone]));
    buscaPorSobrenome = vi.spyOn(ownerService, 'searchOwners').mockReturnValue(of([donoPorSobrenome]));
  });

  // @verifica: CT-130
  it('RN-018 · texto com letras e numeros chama a busca por sobrenome e nao a busca por telefone', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    component.searchByLastName('Franklin2');
    await fixture.whenStable();
    fixture.detectChanges();

    expect(buscaPorSobrenome).toHaveBeenCalledWith('Franklin2');
    expect(buscaPorTelefone).not.toHaveBeenCalled();

    const nomes = fixture.debugElement
      .queryAll(By.css('.ownerFullName'))
      .map(item => (item.nativeElement as HTMLElement).textContent);
    expect(nomes).toEqual(['George Franklin2']);
  });

  // @verifica: CT-130
  it('RN-018 · numero seguido de letras nao e telefone: vai inteiro como sobrenome, sem tirar a mascara', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    component.searchByLastName('608-555abc');
    await fixture.whenStable();
    fixture.detectChanges();

    expect(buscaPorSobrenome).toHaveBeenCalledWith('608-555abc');
    expect(buscaPorTelefone).not.toHaveBeenCalled();
  });

  // @verifica: CT-130
  it('RN-008 · em contraste, o mesmo campo com so digitos e mascara busca por telefone e nao por sobrenome', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    component.searchByLastName('(608) 555-1023');
    await fixture.whenStable();
    fixture.detectChanges();

    expect(buscaPorTelefone).toHaveBeenCalledWith('6085551023');
    expect(buscaPorSobrenome).not.toHaveBeenCalled();
  });
});
