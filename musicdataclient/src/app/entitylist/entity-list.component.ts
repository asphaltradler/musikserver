import {OnDestroy} from '@angular/core';
import {AbstractEntity} from '../entities/abstractEntity';
import {ActivatedRoute, EventType, Params, Router} from '@angular/router';
import {AbstractEntityService} from '../services/abstractEntityService';
import {Subscription} from 'rxjs';
import {SearchfieldComponent} from '../controls/searchfield.component';
import {Page} from '../entities/page';
import {appDefaults} from '../../config/config';

@Object
export abstract class EntityListComponent<E extends AbstractEntity> implements OnDestroy {
  public static urlParamEntitySearchTitle = 'title';
  private static urlParamEntityName = 'searchby';

  public entityType!: typeof AbstractEntity;
  public page?: Page<E>;
  private _pageSize = appDefaults.defaultPageSize;

  private _filter = '';
  private titleFor = '';

  private changeSubscription: Subscription;
  private lastSearchSubscription?: Subscription;

  private _searchEntityType!: typeof AbstractEntity;

  private lastSearchId?: Number;
  private _searchName = '';

  public lastSearchPerformance?: string;

  protected _searchableEntities: typeof AbstractEntity[];

  constructor(protected service: AbstractEntityService<E>,
              protected route: ActivatedRoute,
              protected router: Router) {
    this.entityType = service.entityType;
    this._searchEntityType = this.entityType;
    //eigenen Typ ausschließen in Darstellung
    this._searchableEntities = SearchfieldComponent.searchEntities.filter(
      (entity) => entity != this.entityType
    );
    //default/Vorbelegung bei Aktivierung
    this.changeSubscription = router.events.subscribe((event) => {
      if (event.type === EventType.ActivationEnd) {
        this.startSearchFromQuery();
      }
    });
    console.log(`${this.entityType.getNameSingular()}List created`);
  }

  ngOnDestroy(): void {
    this.changeSubscription?.unsubscribe();
    this.lastSearchSubscription?.unsubscribe();
    this._filter = '';
  }

  startSearchFromQuery(): void {
    const queryParamMap = this.route.snapshot.queryParamMap;
    const searchEntityName = queryParamMap.get(EntityListComponent.urlParamEntityName);
    if (searchEntityName) {
      const ent = SearchfieldComponent.searchEntities.find(e => e.entityName === searchEntityName);
      if (ent) {
        const id = queryParamMap.get('id');
        const searchString = queryParamMap.get(EntityListComponent.urlParamEntitySearchTitle);
        if (id) {
          this.searchByEntityId(ent, Number.parseInt(id || '-1'), searchString || '');
        } else if (searchString) {
          this.searchByEntityName(ent, searchString || '');
        }
      }
    } else {
      //default: alle anzeigen
      this.searchByEntityName(this.entityType, '');
    }
  }

  searchByEntityName(searchEntityType: typeof AbstractEntity, searchString: string) {
    this.searchByEntityIdOrName(searchEntityType, 0, undefined, searchString);
  }

  searchByEntityId(searchEntityType: typeof AbstractEntity, id: number, searchString: string) {
    this.searchByEntityIdOrName(searchEntityType, 0, id, searchString);
  }

  private searchByEntityIdOrName(searchEntityType: typeof AbstractEntity, pageNumber: number, id?: Number, searchString?: string) {
    //falls noch eine Suche unterwegs ist: abbrechen
    this.lastSearchSubscription?.unsubscribe();
    console.log(`Suche ${this.entityType.namePlural} nach ${searchEntityType.entityName}=${searchString || '*'}`);
    const obs = id
      ? this.service.findByOtherId(searchEntityType, id.valueOf(), pageNumber, this._pageSize)
      : searchEntityType === this.entityType
        ? this.service.findNameLike(searchString?.toLowerCase() || '', pageNumber, this._pageSize)
        : this.service.findByOtherNameLike(searchEntityType, searchString?.toLowerCase() || '', pageNumber, this._pageSize);
    const time = performance.now();
    this.lastSearchSubscription = obs.subscribe(page => {
      this.titleFor = searchString ? `für ${searchEntityType.getNameSingular()}='${searchString}'` : 'insgesamt';
      this.fillData(page, searchEntityType, id, searchString);
      const timeString = (performance.now() - time).toFixed(2);
      this.lastSearchPerformance = `Suche ${this.entityType.namePlural} nach ${searchEntityType.entityName}=${searchString || '*'} dauerte ${timeString}ms`;
      console.log(this.lastSearchPerformance);
    });
  }

  fillData(page: Page<E>, searchEntityType: typeof AbstractEntity, searchId?: Number, searchString?: string) {
    this.page = page;
    this._searchEntityType = searchEntityType;
    this.lastSearchId = searchId;
    this._searchName = searchString || '';
  }

  searchPreviousPage(): void {
    if (this._searchEntityType && this.hasPreviousPage()) {
      this.searchByEntityIdOrName(this._searchEntityType, this.page!.number - 1, this.lastSearchId, this._searchName);
    }
  }

  searchNextPage(): void {
    if (this._searchEntityType && this.hasNextPage()) {
      this.searchByEntityIdOrName(this._searchEntityType, this.page!.number + 1, this.lastSearchId, this._searchName);
    }
  }

  navigateOtherEntityByThis(entityType: typeof AbstractEntity, entity: AbstractEntity) {
    this.navigateOtherEntityBy(entityType, this.entityType, entity);
  }

  navigateOtherEntityByItself(entityType: typeof AbstractEntity, entity: AbstractEntity) {
    this.navigateOtherEntityBy(entityType, entityType, entity);
  }

  /**
   * Sucht mittels einer gegebenen Entity als Suchkriterium in einer anderen Entity-Liste.
   * Beim Öffnen der entsprechenden View (anderen EntityListComponent) wird dann über die
   * queryParams die entsprechende Suche ausgelöst.
   * @param entityType der Typ, zu dem navigiert wird
   * @param searchEntityType der Typ, anhand dem gesucht werden soll
   * @param entity eine Entity des searchEntityType, nach der gesucht wird (anhand id)
   */
  navigateOtherEntityBy(entityType: typeof AbstractEntity,
                        searchEntityType: typeof AbstractEntity, entity: AbstractEntity) {
    const params: Params = {};
    params[EntityListComponent.urlParamEntityName] = searchEntityType.entityName;
    params[EntityListComponent.urlParamEntitySearchTitle] = entity.name;
    params['id'] = entity.id;
    console.log(`Navigiere nach ${entityType.entityName} mit ${Object.entries(params).join('|')}`);
    this.router.navigate([entityType.entityName], {queryParams: params});
  }

  trackByItemId(_index: number, item: E): number {
    return item.id;
  }

  get pageSize(): number {
    return this._pageSize;
  }

  set pageSize(value: number) {
    this._pageSize = value;
    this.searchByEntityName(this.searchEntityType, this.searchName);
  }

  get searchName(): string {
    return this._searchName;
  }

  set searchName(value: string) {
    this._searchName = value;
    this.searchByEntityName(this.searchEntityType, this.searchName);
  }

  get filter(): string {
    return this._filter;
  }

  set filter(value: string) {
    this._filter = value?.toLowerCase();
  }

  get searchEntityType(): typeof AbstractEntity {
    return this._searchEntityType;
  }

  set searchEntityType(value: typeof AbstractEntity) {
    this._searchEntityType = value;
  }

  get title() {
    if (!this.page) {
      return '';
    }
    let title;
    const entityCount = this.entities.length;
    if (this._filter && entityCount < this.page.numberOfElements) {
      title = `${entityCount} von ${this.entityType.getNumberDescription(this.page.totalElements)}`;
    } else {
      const entityStart = this.page.number * this.page.size;
      title = entityCount !== this.page.totalElements
        ? `${this.entityType.getNumbersDescription(entityStart+1, this.page.numberOfElements + entityStart)} von ${this.page.totalElements}`
        : this.entityType.getNumberDescription(this.page.totalElements);
    }
    return `${title} ${this.titleFor}`;
  }

  get entities(): E[] {
    if (!this.page) {
      return [];
    }
    return this._filter
      ? this.page.content.filter((ent) => ent.name?.toLowerCase().includes(this._filter))
      : this.page.content;
  }

  hasPreviousPage() {
    return !this.page?.first;
  }

  hasNextPage() {
    return !this.page?.last;
  }

  get searchableEntities() {
    return this._searchableEntities;
  }
}
