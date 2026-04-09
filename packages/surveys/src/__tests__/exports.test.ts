import { describe, expect, it } from 'vitest'
import * as SurveysHeadless from '../headless'
import * as SurveysIndex from '../index'

describe('index.ts barrel exports', () => {
  it('exports all styled components, hooks, scoring functions, and provider', () => {
    // Provider
    expect(SurveysIndex.SurveysProvider).toBeDefined()

    // Styled display components
    expect(SurveysIndex.SurveyPopover).toBeDefined()
    expect(SurveysIndex.SurveyModal).toBeDefined()
    expect(SurveysIndex.SurveySlideout).toBeDefined()
    expect(SurveysIndex.SurveyBanner).toBeDefined()
    expect(SurveysIndex.SurveyInline).toBeDefined()

    // Hooks
    expect(SurveysIndex.useSurveys).toBeDefined()
    expect(SurveysIndex.useSurvey).toBeDefined()
    expect(SurveysIndex.useSurveyScoring).toBeDefined()

    // Scoring functions
    expect(SurveysIndex.calculateNPS).toBeDefined()
    expect(SurveysIndex.calculateCSAT).toBeDefined()
    expect(SurveysIndex.calculateCES).toBeDefined()

    // Verify headless components are NOT in the styled entry point
    expect((SurveysIndex as Record<string, unknown>).HeadlessSurvey).toBeUndefined()
    expect((SurveysIndex as Record<string, unknown>).HeadlessQuestionRating).toBeUndefined()
    expect((SurveysIndex as Record<string, unknown>).HeadlessQuestionText).toBeUndefined()
    expect((SurveysIndex as Record<string, unknown>).HeadlessQuestionSelect).toBeUndefined()
    expect((SurveysIndex as Record<string, unknown>).HeadlessQuestionBoolean).toBeUndefined()
  })
})

describe('headless.ts barrel exports', () => {
  it('exports all headless components, hooks, scoring functions, and provider', () => {
    // Provider
    expect(SurveysHeadless.SurveysProvider).toBeDefined()

    // Headless components
    expect(SurveysHeadless.HeadlessSurvey).toBeDefined()
    expect(SurveysHeadless.HeadlessQuestionRating).toBeDefined()
    expect(SurveysHeadless.HeadlessQuestionText).toBeDefined()
    expect(SurveysHeadless.HeadlessQuestionSelect).toBeDefined()
    expect(SurveysHeadless.HeadlessQuestionBoolean).toBeDefined()

    // Hooks
    expect(SurveysHeadless.useSurveys).toBeDefined()
    expect(SurveysHeadless.useSurvey).toBeDefined()
    expect(SurveysHeadless.useSurveyScoring).toBeDefined()

    // Scoring functions
    expect(SurveysHeadless.calculateNPS).toBeDefined()
    expect(SurveysHeadless.calculateCSAT).toBeDefined()
    expect(SurveysHeadless.calculateCES).toBeDefined()

    // Verify styled components are NOT in the headless entry point
    expect((SurveysHeadless as Record<string, unknown>).SurveyPopover).toBeUndefined()
    expect((SurveysHeadless as Record<string, unknown>).SurveyModal).toBeUndefined()
    expect((SurveysHeadless as Record<string, unknown>).SurveySlideout).toBeUndefined()
    expect((SurveysHeadless as Record<string, unknown>).SurveyBanner).toBeUndefined()
    expect((SurveysHeadless as Record<string, unknown>).SurveyInline).toBeUndefined()
  })
})
