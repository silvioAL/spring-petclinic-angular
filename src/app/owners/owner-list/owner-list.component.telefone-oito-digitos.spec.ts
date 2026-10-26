import type { Mock } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
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

// RN-018 / RN-008: a tela de donos usa o mesmo campo; 8 digitos tambem buscam por telefone e o servidor casa pelos 8 ultimos (SPEC-002 secao 2.1)
describe('OwnerListComponent · 8 digitos disparam busca por telefone', () => {
  let component: OwnerListComponent;
  let fixture: ComponentFixture<OwnerListComponent>;
  let ownerService: OwnerServiceStub;
  let buscaPorTelefone: Mock;
  let buscaPorSobrenome: Mock;

  const dono: Owner = {
    id: 1,
    firstName: 'George',
    lastName: 'Franklin',
    address: '110 W. Liberty St.',
    city: 'Madison',
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
    buscaPorTelefone = vi.spyOn(ownerService, 'searchOwnersByTelephone').mockReturnValue(of([dono]));
    buscaPorSobrenome = vi.spyOn(ownerService, 'searchOwners').mockReturnValue(of([]));
  });

  // @verifica: CT-126
  it('RN-008 · 8 digitos chamam a busca por telefone e mostram o dono encontrado', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    component.searchByLastName('85551023');
    await fixture.whenStable();
    fixture.detectChanges();

    expect(buscaPorTelefone).toHaveBeenCalledWith('85551023');
    expect(buscaPorSobrenome).not.toHaveBeenCalled();

    const nomes = fixture.debugElement
      .queryAll(By.css('.ownerFullName'))
      .map(item => (item.nativeElement as HTMLElement).textContent);
    expect(nomes).toEqual(['George Franklin']);
  });
});
