<?php

namespace Tests\Unit;

use App\Services\MatchScoreService;
use PHPUnit\Framework\TestCase;

class MatchScoreServiceTest extends TestCase
{
    public function test_tokenise_normalises_trims_and_dedupes(): void
    {
        $tokens = MatchScoreService::tokenise('Machine Learning,  AI , machine learning');

        $this->assertSame(['machine learning', 'ai'], $tokens);
    }

    public function test_tokenise_accepts_arrays(): void
    {
        $tokens = MatchScoreService::tokenise([' Deep Learning ', 'NLP', 'nlp']);

        $this->assertSame(['deep learning', 'nlp'], $tokens);
    }

    public function test_jaccard_score_for_partial_overlap(): void
    {
        // intersection {b} = 1, union {a,b,c} = 3 -> 1/3
        $result = MatchScoreService::score(['a', 'b'], ['b', 'c']);

        $this->assertEqualsWithDelta(0.3333, $result['score'], 0.0001);
        $this->assertSame(33, $result['percentage']);
        $this->assertSame(1, $result['matching_count']);
        $this->assertSame(['b'], $result['matching_tags']);
    }

    public function test_known_case_matches_67_percent(): void
    {
        // The seeded demo case: 2 shared of 3 union -> 67%.
        $result = MatchScoreService::score(
            ['computer vision', 'deep learning'],
            ['machine learning', 'deep learning', 'computer vision'],
        );

        $this->assertSame(67, $result['percentage']);
        $this->assertSame(2, $result['matching_count']);
    }

    public function test_identical_sets_score_one(): void
    {
        $result = MatchScoreService::score(['x', 'y'], ['y', 'x']);

        $this->assertSame(1.0, $result['score']);
        $this->assertSame(100, $result['percentage']);
    }

    public function test_disjoint_sets_score_zero(): void
    {
        $result = MatchScoreService::score(['x'], ['y']);

        $this->assertSame(0.0, $result['score']);
        $this->assertSame(0, $result['percentage']);
    }

    public function test_empty_inputs_do_not_divide_by_zero(): void
    {
        $result = MatchScoreService::score([], []);

        $this->assertSame(0.0, $result['score']);
        $this->assertSame(0, $result['matching_count']);
    }

    public function test_overlap_ratio_is_relative_to_candidate(): void
    {
        // 2 of the 3 candidate keywords are present in the existing set.
        $result = MatchScoreService::overlap(['a', 'b', 'c'], ['b', 'c', 'd']);

        $this->assertSame(2, $result['overlap_count']);
        $this->assertEqualsWithDelta(0.6667, $result['overlap_ratio'], 0.0001);
    }
}
