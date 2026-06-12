import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FilterBarComponent } from './filter-bar.component';

describe('FilterBarComponent', () => {
  let fixture: ComponentFixture<FilterBarComponent>;
  let component: FilterBarComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FilterBarComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FilterBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('emits the current filter on apply', () => {
    const spy = spyOn(component.apply, 'emit');
    component.filter.countryId = 3;
    component.apply.emit(component.filter);
    expect(spy).toHaveBeenCalledWith(jasmine.objectContaining({ countryId: 3 }));
  });

  it('clears values on reset', () => {
    component.filter = { countryId: 5, vehicleTypeId: 2, from: '2026-06-01', to: '2026-06-09' };
    component.reset();
    expect(component.filter.countryId).toBeNull();
    expect(component.filter.vehicleTypeId).toBeNull();
    expect(component.filter.from).toBeNull();
  });
});
