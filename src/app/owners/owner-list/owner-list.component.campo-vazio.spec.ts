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

// RN-018: campo vazio mantem o comportamento de hoje, a listagem completa, sem busca por telefone nem por sobrenome (SPEC-002 secao 8)
describe('OwnerListComponent · campo vazio mantem o comportamento de hoje', () => {
  let component: OwnerListComponent;
  let fixture: ComponentFixture<OwnerListComponent>;
  let ownerService: OwnerServiceStub;
  let listagemCompleta: Mock;
  let buscaPorTelefone: Mock;
  let buscaPorSobrenome: Mock;

  const donoA: Owner = {
    id: 1,
    firstName: 'George',
    lastName: 'Franklin',
    address: '110 W. Liberty St.',
    city: 'Madison',
    telephone: '6085551023',
    pets: null
  };

  const donoB: Owner = {
    id: 2,
    firstName: 'Betty',
    lastName: 'Davis',
    address: '638 Cardinal Ave.',
    city: 'Sun Prairie',
    telephone: '6085551749',
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
    listagemCompleta = vi.spyOn(ownerService, 'getOwners').mockReturnValue(of([donoA, donoB]));
    buscaPorSobrenome = vi.spyOn(ownerService, 'searchOwners').mockReturnValue(of([]));
    buscaPorTelefone = vi.spyOn(ownerService, 'searchOwnersByTelephone').mockReturnValue(of([donoA]));
  });

  // @verifica: CT-132
  it('RN-018 · campo vazio mostra a listagem completa sem chamar nenhuma busca', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    component.searchByLastName('');
    await fixture.whenStable();
    fixture.detectChanges();

    expect(listagemCompleta).toHaveBeenCalled();
    expect(buscaPorTelefone).not.toHaveBeenCalled();
    expect(buscaPorSobrenome).not.toHaveBeenCalled();

    const nomes = fixture.debugElement
      .queryAll(By.css('.ownerFullName'))
      .map(item => (item.nativeElement as HTMLElement).textContent);
    expect(nomes).toEqual(['George Franklin', 'Betty Davis']);
  });

  // @verifica: CT-132
  it('RN-018 · apagar um telefone digitado volta a listagem completa, sem busca vazia por telefone', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    // contraste: com digitos a tela busca por telefone (SPEC-002, C1)
    component.searchByLastName('6085551023');
    await fixture.whenStable();
    fixture.detectChanges();
    expect(buscaPorTelefone).toHaveBeenCalledWith('6085551023');

    const chamadasDaListagemAntes = listagemCompleta.mock.calls.length;

    // campo apagado: comportamento de hoje, listagem completa
    component.searchByLastName('');
    await fixture.whenStable();
    fixture.detectChanges();

    expect(listagemCompleta.mock.calls.length).toBeGreaterThan(chamadasDaListagemAntes);
    expect(buscaPorTelefone).not.toHaveBeenCalledWith('');
    expect(buscaPorSobrenome).not.toHaveBeenCalled();

    const nomes = fixture.debugElement
      .queryAll(By.css('.ownerFullName'))
      .map(item => (item.nativeElement as HTMLElement).textContent);
    expect(nomes).toEqual(['George Franklin', 'Betty Davis']);
  });
});
