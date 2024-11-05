import {ComponentFixture, TestBed} from '@angular/core/testing';

import {WerkListComponent} from './werk-list.component';
import {provideHttpClient} from '@angular/common/http';
import {WerkService} from '../services/werk.service';
import {provideRouter} from '@angular/router';

describe('WerkListComponent', () => {
  let component: WerkListComponent;
  let fixture: ComponentFixture<WerkListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WerkListComponent],
      providers: [
        WerkService,
        provideHttpClient(),
        provideRouter([])
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(WerkListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
