import { TestBed } from '@angular/core/testing';

import { MayanService } from './mayan.service';

describe('MayanService', () => {
  let service: MayanService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MayanService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
