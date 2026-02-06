import { Test, TestingModule } from '@nestjs/testing';
import { PrestigeCalculator } from './prestige-calculator.service';
import { PrestigeLevel } from '@prisma/client';

describe('PrestigeCalculator', () => {
  let service: PrestigeCalculator;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrestigeCalculator],
    }).compile();

    service = module.get<PrestigeCalculator>(PrestigeCalculator);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculateLevel', () => {
    describe('Platinum level', () => {
      it('should return PLATINUM for 25+ jobs and 4.8+ rating', () => {
        expect(service.calculateLevel(25, 4.8)).toBe(PrestigeLevel.PLATINUM);
        expect(service.calculateLevel(30, 4.9)).toBe(PrestigeLevel.PLATINUM);
        expect(service.calculateLevel(50, 5.0)).toBe(PrestigeLevel.PLATINUM);
      });

      it('should not return PLATINUM for 25+ jobs with < 4.8 rating', () => {
        expect(service.calculateLevel(25, 4.7)).toBe(PrestigeLevel.GOLD);
        expect(service.calculateLevel(30, 4.5)).toBe(PrestigeLevel.GOLD);
      });

      it('should not return PLATINUM for < 25 jobs with 4.8+ rating', () => {
        expect(service.calculateLevel(24, 4.8)).toBe(PrestigeLevel.GOLD);
        expect(service.calculateLevel(20, 5.0)).toBe(PrestigeLevel.GOLD);
      });
    });

    describe('Gold level', () => {
      it('should return GOLD for 10-24 jobs and 4.5+ rating', () => {
        expect(service.calculateLevel(10, 4.5)).toBe(PrestigeLevel.GOLD);
        expect(service.calculateLevel(15, 4.6)).toBe(PrestigeLevel.GOLD);
        expect(service.calculateLevel(24, 4.7)).toBe(PrestigeLevel.GOLD);
      });

      it('should not return GOLD for 10+ jobs with < 4.5 rating', () => {
        expect(service.calculateLevel(10, 4.4)).toBe(PrestigeLevel.SILVER);
        expect(service.calculateLevel(15, 4.0)).toBe(PrestigeLevel.SILVER);
      });

      it('should not return GOLD for < 10 jobs with 4.5+ rating', () => {
        expect(service.calculateLevel(9, 4.5)).toBe(PrestigeLevel.SILVER);
        expect(service.calculateLevel(5, 4.8)).toBe(PrestigeLevel.SILVER);
      });
    });

    describe('Silver level', () => {
      it('should return SILVER for 5-9 jobs and 4.0+ rating', () => {
        expect(service.calculateLevel(5, 4.0)).toBe(PrestigeLevel.SILVER);
        expect(service.calculateLevel(7, 4.2)).toBe(PrestigeLevel.SILVER);
        expect(service.calculateLevel(9, 4.4)).toBe(PrestigeLevel.SILVER);
      });

      it('should not return SILVER for 5+ jobs with < 4.0 rating', () => {
        expect(service.calculateLevel(5, 3.9)).toBe(PrestigeLevel.BRONZE);
        expect(service.calculateLevel(10, 3.5)).toBe(PrestigeLevel.BRONZE);
      });

      it('should not return SILVER for < 5 jobs with 4.0+ rating', () => {
        expect(service.calculateLevel(4, 4.0)).toBe(PrestigeLevel.BRONZE);
        expect(service.calculateLevel(1, 5.0)).toBe(PrestigeLevel.BRONZE);
      });
    });

    describe('Bronze level', () => {
      it('should return BRONZE for < 5 jobs regardless of rating', () => {
        expect(service.calculateLevel(0, 5.0)).toBe(PrestigeLevel.BRONZE);
        expect(service.calculateLevel(1, 4.8)).toBe(PrestigeLevel.BRONZE);
        expect(service.calculateLevel(4, 4.5)).toBe(PrestigeLevel.BRONZE);
      });

      it('should return BRONZE for < 4.0 rating regardless of jobs', () => {
        expect(service.calculateLevel(5, 3.9)).toBe(PrestigeLevel.BRONZE);
        expect(service.calculateLevel(10, 3.5)).toBe(PrestigeLevel.BRONZE);
        expect(service.calculateLevel(25, 2.0)).toBe(PrestigeLevel.BRONZE);
      });
    });

    describe('Boundary cases', () => {
      it('should handle edge cases correctly', () => {
        // Exact boundaries
        expect(service.calculateLevel(4, 4.0)).toBe(PrestigeLevel.BRONZE); // Just before Silver
        expect(service.calculateLevel(5, 4.0)).toBe(PrestigeLevel.SILVER); // Exact Silver threshold
        expect(service.calculateLevel(9, 4.4)).toBe(PrestigeLevel.SILVER); // Just before Gold
        expect(service.calculateLevel(10, 4.5)).toBe(PrestigeLevel.GOLD); // Exact Gold threshold
        expect(service.calculateLevel(24, 4.7)).toBe(PrestigeLevel.GOLD); // Just before Platinum
        expect(service.calculateLevel(25, 4.8)).toBe(PrestigeLevel.PLATINUM); // Exact Platinum threshold
      });

      it('should round rating to 1 decimal place', () => {
        expect(service.calculateLevel(25, 4.75)).toBe(PrestigeLevel.PLATINUM); // Rounds to 4.8
        expect(service.calculateLevel(25, 4.74)).toBe(PrestigeLevel.GOLD); // Rounds to 4.7
      });
    });
  });

  describe('getNextLevelThreshold', () => {
    it('should return Silver threshold for Bronze users', () => {
      const threshold = service.getNextLevelThreshold(PrestigeLevel.BRONZE);
      expect(threshold.level).toBe(PrestigeLevel.SILVER);
      expect(threshold.requiredJobs).toBe(5);
      expect(threshold.requiredRating).toBe(4.0);
    });

    it('should return Gold threshold for Silver users', () => {
      const threshold = service.getNextLevelThreshold(PrestigeLevel.SILVER);
      expect(threshold.level).toBe(PrestigeLevel.GOLD);
      expect(threshold.requiredJobs).toBe(10);
      expect(threshold.requiredRating).toBe(4.5);
    });

    it('should return Platinum threshold for Gold users', () => {
      const threshold = service.getNextLevelThreshold(PrestigeLevel.GOLD);
      expect(threshold.level).toBe(PrestigeLevel.PLATINUM);
      expect(threshold.requiredJobs).toBe(25);
      expect(threshold.requiredRating).toBe(4.8);
    });

    it('should return no level for Platinum users (max level)', () => {
      const threshold = service.getNextLevelThreshold(PrestigeLevel.PLATINUM);
      expect(threshold.level).toBeUndefined();
      expect(threshold.requiredJobs).toBe(25);
      expect(threshold.requiredRating).toBe(4.8);
    });
  });

  describe('calculateProgress', () => {
    it('should return 100% for Platinum users', () => {
      const progress = service.calculateProgress(30, 5.0);
      expect(progress).toBe(100);
    });

    it('should calculate progress correctly for Bronze users', () => {
      const progress1 = service.calculateProgress(2, 3.5);
      expect(progress1).toBeGreaterThan(0);
      expect(progress1).toBeLessThan(100);

      const progress2 = service.calculateProgress(5, 4.0);
      expect(progress2).toBe(100); // Reached Silver
    });

    it('should calculate progress correctly for Silver users', () => {
      const progress1 = service.calculateProgress(7, 4.3);
      expect(progress1).toBeGreaterThan(0);
      expect(progress1).toBeLessThan(100);

      const progress2 = service.calculateProgress(10, 4.5);
      expect(progress2).toBe(100); // Reached Gold
    });
  });

  describe('isEligibleForSuspension', () => {
    it('should return true for users with < 2.5 rating and 5+ reviews', () => {
      expect(service.isEligibleForSuspension(5, 2.4)).toBe(true);
      expect(service.isEligibleForSuspension(10, 2.0)).toBe(true);
      expect(service.isEligibleForSuspension(5, 1.5)).toBe(true);
    });

    it('should return false for users with 5+ reviews but >= 2.5 rating', () => {
      expect(service.isEligibleForSuspension(5, 2.5)).toBe(false);
      expect(service.isEligibleForSuspension(10, 3.0)).toBe(false);
      expect(service.isEligibleForSuspension(5, 4.0)).toBe(false);
    });

    it('should return false for users with < 5 reviews regardless of rating', () => {
      expect(service.isEligibleForSuspension(4, 1.0)).toBe(false);
      expect(service.isEligibleForSuspension(3, 2.0)).toBe(false);
      expect(service.isEligibleForSuspension(1, 2.4)).toBe(false);
    });
  });
});
