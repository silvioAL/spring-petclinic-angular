/*
 *
 *  * Copyright 2016-2017 the original author or authors.
 *  *
 *  * Licensed under the Apache License, Version 2.0 (the "License");
 *  * you may not use this file except in compliance with the License.
 *  * You may obtain a copy of the License at
 *  *
 *  *      http://www.apache.org/licenses/LICENSE-2.0
 *  *
 *  * Unless required by applicable law or agreed to in writing, software
 *  * distributed under the License is distributed on an "AS IS" BASIS,
 *  * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  * See the License for the specific language governing permissions and
 *  * limitations under the License.
 *
 */

/**
 * @author Vitaliy Fedoriv
 */

import {Component, computed, inject, signal} from '@angular/core';
import {rxResource} from '@angular/core/rxjs-interop';
import {HttpErrorResponse} from '@angular/common/http';
import {OwnerService} from '../owner.service';
import {Owner} from '../owner';
import {Router} from '@angular/router';

// SPEC-002 secao 2.1: tira espacos e mascara (parenteses, hifen, ponto); so digitos = telefone
function digitosDoTelefone(texto: string): string | null {
  const semMascara = texto.replace(/[\s().-]/g, '');
  return /^\d+$/.test(semMascara) ? semMascara : null;
}

@Component({
  selector: 'app-owner-list',
  standalone: false,
  templateUrl: './owner-list.component.html',
  styleUrls: ['./owner-list.component.css']
})
export class OwnerListComponent {
  private router = inject(Router);
  private ownerService = inject(OwnerService);

  protected readonly lastName = signal('');
  // search term applied by the "Find Owner" button: changing it reloads the owners
  private readonly searchTerm = signal('');

  private readonly ownersResource = rxResource({
    params: () => this.searchTerm(),
    stream: ({params}) => {
      if (params === '') {
        return this.ownerService.getOwners();
      }
      const telefone = digitosDoTelefone(params);
      return telefone !== null
        ? this.ownerService.searchOwnersByTelephone(telefone)
        : this.ownerService.searchOwners(params);
    }
  });

  protected readonly owners = computed(() =>
    this.ownersResource.hasValue() ? this.ownersResource.value() : null);
  protected readonly isOwnersDataReceived = computed(() => !this.ownersResource.isLoading());

  protected readonly isTelephoneSearch = computed(() =>
    digitosDoTelefone(this.searchTerm()) !== null);

  // telefone sem nenhum dono: lista vazia com aviso (SPEC-002 C4)
  protected readonly noOwnerWithTelephone = computed(() => {
    const lista = this.owners();
    return this.isOwnersDataReceived() && this.isTelephoneSearch() && !!lista && lista.length === 0;
  });

  // 400 do servidor na busca por telefone: mostra a mensagem recebida junto ao campo (SPEC-002 C6)
  protected readonly serverMessage = computed<string | null>(() => {
    const erro: unknown = this.ownersResource.error();
    if (!erro) {
      return null;
    }
    const http = erro instanceof HttpErrorResponse
      ? erro
      : (erro as { cause?: unknown }).cause instanceof HttpErrorResponse
        ? (erro as { cause: HttpErrorResponse }).cause
        : null;
    if (http === null || http.status !== 400) {
      return null;
    }
    return http.error?.message ?? http.message;
  });

  onSelect(owner: Owner) {
    this.router.navigate(['/owners', owner.id]);
  }

  addOwner() {
    this.router.navigate(['/owners/add']);
  }

  searchByLastName(lastName: string) {
    if (lastName === this.searchTerm()) {
      this.ownersResource.reload();
    } else {
      this.searchTerm.set(lastName);
    }
  }
}
