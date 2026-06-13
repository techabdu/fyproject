<?php

namespace Database\Seeders;

use App\Models\InterestTag;
use Illuminate\Database\Seeder;

class InterestTagSeeder extends Seeder
{
    public function run(): void
    {
        $tags = [
            // Computing
            'machine learning', 'artificial intelligence', 'deep learning',
            'computer vision', 'natural language processing', 'data science',
            'big data', 'cybersecurity', 'cryptography', 'computer networks',
            'cloud computing', 'distributed systems', 'databases', 'data mining',
            'software engineering', 'web development', 'mobile development',
            'internet of things', 'blockchain', 'algorithms', 'operating systems',
            'human computer interaction', 'bioinformatics', 'embedded systems',
            // Maths / Stats / Physics
            'numerical analysis', 'optimization', 'graph theory', 'probability',
            'statistical modelling', 'time series', 'regression analysis',
            'computational physics', 'quantum computing',
        ];

        foreach ($tags as $tag) {
            InterestTag::firstOrCreate(['name' => InterestTag::normalise($tag)]);
        }
    }
}
