<?php

namespace App\Services;

use Illuminate\Support\Str;

/**
 * Keyword-overlap match scoring (Module 2) and the duplicate/overlap
 * indicator (Module 1). Deliberately simple and explainable for the
 * report — pure set arithmetic, no ML/embeddings (per brief §2.2).
 */
class MatchScoreService
{
    /**
     * Normalise free-form keyword input into a clean set of tokens.
     * Accepts an array of strings or a comma/semicolon/newline separated string.
     *
     * @return list<string> de-duplicated, lowercased, trimmed, non-empty tokens
     */
    public static function tokenise(string|array|null $input): array
    {
        if ($input === null) {
            return [];
        }

        $parts = is_array($input)
            ? $input
            : (preg_split('/[,;\n]+/', $input) ?: []);

        $tokens = [];
        foreach ($parts as $part) {
            $token = Str::lower(trim(preg_replace('/\s+/', ' ', (string) $part)));
            if ($token !== '') {
                $tokens[$token] = true; // key de-dupes
            }
        }

        return array_keys($tokens);
    }

    /**
     * Jaccard similarity between a student's proposal keywords and a
     * supervisor's interest tags.
     *
     * @param  string|array<int,string>|null  $studentKeywords
     * @param  string|array<int,string>|null  $supervisorTags
     * @return array{score: float, percentage: int, matching_tags: list<string>, matching_count: int, union_count: int}
     */
    public static function score(string|array|null $studentKeywords, string|array|null $supervisorTags): array
    {
        $a = self::tokenise($studentKeywords);
        $b = self::tokenise($supervisorTags);

        $intersection = array_values(array_intersect($a, $b));
        $union = array_values(array_unique(array_merge($a, $b)));

        $score = count($union) === 0 ? 0.0 : count($intersection) / count($union);

        return [
            'score' => round($score, 4),
            'percentage' => (int) round($score * 100),
            'matching_tags' => $intersection,
            'matching_count' => count($intersection),
            'union_count' => count($union),
        ];
    }

    /**
     * Overlap of one keyword set against another, expressed as the share of
     * the candidate set that is also present in the existing set. Used as the
     * advisory duplicate indicator when uploading/viewing a project.
     *
     * @return array{overlap_count: int, overlap_ratio: float, matching: list<string>}
     */
    public static function overlap(string|array|null $candidate, string|array|null $existing): array
    {
        $a = self::tokenise($candidate);
        $b = self::tokenise($existing);

        $matching = array_values(array_intersect($a, $b));
        $ratio = count($a) === 0 ? 0.0 : count($matching) / count($a);

        return [
            'overlap_count' => count($matching),
            'overlap_ratio' => round($ratio, 4),
            'matching' => $matching,
        ];
    }
}
