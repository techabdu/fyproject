<?php

namespace Database\Seeders;

use App\Enums\ProjectStatus;
use App\Models\Department;
use App\Models\Project;
use App\Models\ProjectKeyword;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ProjectSeeder extends Seeder
{
    public function run(): void
    {
        $cs = Department::where('name', 'Computer Science')->first()->id;
        $maths = Department::where('name', 'Mathematics')->first()->id;
        $stats = Department::where('name', 'Statistics')->first()->id;
        $physics = Department::where('name', 'Physics')->first()->id;

        $projects = [
            [
                'title' => 'A Deep Learning Approach to Malaria Parasite Detection in Blood Smear Images',
                'abstract' => 'This project develops a convolutional neural network that classifies thin blood smear microscopy images to detect malaria parasites, achieving high accuracy and offering a low-cost diagnostic aid for rural clinics.',
                'department_id' => $cs, 'graduation_year' => 2023, 'status' => ProjectStatus::Approved,
                'uploader' => 'bilal.yakubu@student.abu.edu.ng',
                'keywords' => ['machine learning', 'deep learning', 'computer vision', 'medical imaging'],
            ],
            [
                'title' => 'Intrusion Detection System Using Machine Learning on Network Traffic',
                'abstract' => 'A machine learning based intrusion detection system that inspects network traffic features to flag anomalous and malicious flows, evaluated on a benchmark dataset with several classifiers compared.',
                'department_id' => $cs, 'graduation_year' => 2022, 'status' => ProjectStatus::Approved,
                'uploader' => 'chioma.nwosu@student.abu.edu.ng',
                'keywords' => ['cybersecurity', 'machine learning', 'computer networks', 'intrusion detection'],
            ],
            [
                'title' => 'Design and Implementation of a Student Project Repository Web Application',
                'abstract' => 'A full-stack web application that digitises the final year project archive, providing search, moderation and controlled document access for students and staff across a department.',
                'department_id' => $cs, 'graduation_year' => 2024, 'status' => ProjectStatus::Approved,
                'uploader' => 'daniel.achi@student.abu.edu.ng',
                'keywords' => ['web development', 'software engineering', 'databases'],
            ],
            [
                'title' => 'Sentiment Analysis of Hausa Language Tweets Using Natural Language Processing',
                'abstract' => 'This work builds a sentiment classifier for the low-resource Hausa language, assembling an annotated corpus of tweets and comparing lexical and machine learning approaches for polarity detection.',
                'department_id' => $cs, 'graduation_year' => 2023, 'status' => ProjectStatus::Approved,
                'uploader' => 'esther.bawa@student.abu.edu.ng',
                'keywords' => ['natural language processing', 'data science', 'machine learning', 'sentiment analysis'],
            ],
            [
                'title' => 'Numerical Solution of Partial Differential Equations Using Finite Difference Methods',
                'abstract' => 'An investigation of explicit and implicit finite difference schemes for solving parabolic partial differential equations, with stability analysis and error comparison against analytical solutions.',
                'department_id' => $maths, 'graduation_year' => 2022, 'status' => ProjectStatus::Approved,
                'uploader' => 'halima.sule@student.abu.edu.ng',
                'keywords' => ['numerical analysis', 'optimization'],
            ],
            [
                'title' => 'Time Series Forecasting of Inflation Rates in Nigeria',
                'abstract' => 'A comparative study of ARIMA and exponential smoothing models for forecasting monthly inflation, using two decades of national data and evaluating forecast accuracy on a held-out test set.',
                'department_id' => $stats, 'graduation_year' => 2023, 'status' => ProjectStatus::Approved,
                'uploader' => 'tunde.bello@student.abu.edu.ng',
                'keywords' => ['time series', 'statistical modelling', 'regression analysis', 'forecasting'],
            ],

            // ----- Pending (moderation queue) -----------------------------
            [
                'title' => 'Blockchain-Based Land Registry System for Northern Nigeria',
                'abstract' => 'A prototype distributed land registry built on a permissioned blockchain to provide tamper-evident records of land ownership and transfers, with a web portal for verification.',
                'department_id' => $cs, 'graduation_year' => 2024, 'status' => ProjectStatus::Pending,
                'uploader' => 'ahmad.dalhat@student.abu.edu.ng',
                'keywords' => ['blockchain', 'distributed systems', 'web development'],
            ],
            [
                'title' => 'A Convolutional Neural Network for Crop Disease Classification',
                'abstract' => 'This project trains a convolutional neural network on leaf images to classify common crop diseases, packaged behind a simple interface so smallholder farmers can obtain rapid field diagnoses.',
                'department_id' => $cs, 'graduation_year' => 2024, 'status' => ProjectStatus::Pending,
                'uploader' => 'chioma.nwosu@student.abu.edu.ng',
                'keywords' => ['deep learning', 'computer vision', 'machine learning'],
            ],
            [
                'title' => 'Optimization of Solar Panel Placement Using Genetic Algorithms',
                'abstract' => 'A genetic algorithm approach to maximising photovoltaic energy yield by optimising panel orientation and placement under shading constraints, validated with a computational physics simulation.',
                'department_id' => $physics, 'graduation_year' => 2024, 'status' => ProjectStatus::Pending,
                'uploader' => 'ngozi.eze@student.abu.edu.ng',
                'keywords' => ['optimization', 'algorithms', 'computational physics'],
            ],

            // ----- Rejected (with feedback) -------------------------------
            [
                'title' => 'Mobile Application for Campus Navigation',
                'abstract' => 'A mobile application providing turn-by-turn navigation around the university campus using offline maps and points of interest curated for new students.',
                'department_id' => $cs, 'graduation_year' => 2023, 'status' => ProjectStatus::Rejected,
                'uploader' => 'daniel.achi@student.abu.edu.ng',
                'keywords' => ['mobile development', 'web development'],
                'rejection_feedback' => 'The abstract lacks methodology detail and the scope overlaps substantially with an approved 2022 project. Please expand the technical approach and resubmit.',
            ],
        ];

        foreach ($projects as $data) {
            $uploader = User::where('email', $data['uploader'])->first();

            $path = 'projects/'.Str::uuid().'.pdf';
            Storage::disk('local')->put($path, $this->demoPdf($data['title']));

            $project = Project::create([
                'title' => $data['title'],
                'abstract' => $data['abstract'],
                'department_id' => $data['department_id'],
                'graduation_year' => $data['graduation_year'],
                'uploaded_by' => $uploader->id,
                'pdf_path' => $path,
                'status' => $data['status'],
                'rejection_feedback' => $data['rejection_feedback'] ?? null,
            ]);

            foreach (array_unique($data['keywords']) as $keyword) {
                $project->keywords()->create(['keyword' => ProjectKeyword::normalise($keyword)]);
            }
        }
    }

    /** Build a small but syntactically valid single-page PDF (correct xref). */
    private function demoPdf(string $title): string
    {
        $safeTitle = str_replace(['(', ')', '\\'], ['\(', '\)', '\\\\'], $title);
        $text = "BT /F1 16 Tf 60 760 Td ({$safeTitle}) Tj ET";

        $objects = [
            1 => '<</Type/Catalog/Pages 2 0 R>>',
            2 => '<</Type/Pages/Kids[3 0 R]/Count 1>>',
            3 => '<</Type/Page/Parent 2 0 R/MediaBox[0 0 595 842]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>',
            4 => '<</Length '.strlen($text).">>\nstream\n".$text."\nendstream",
            5 => '<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>',
        ];

        $pdf = "%PDF-1.4\n";
        $offsets = [];
        foreach ($objects as $num => $content) {
            $offsets[$num] = strlen($pdf);
            $pdf .= "{$num} 0 obj\n{$content}\nendobj\n";
        }

        $xref = strlen($pdf);
        $size = count($objects) + 1;
        $pdf .= "xref\n0 {$size}\n0000000000 65535 f \n";
        foreach ($offsets as $offset) {
            $pdf .= sprintf("%010d 00000 n \n", $offset);
        }
        $pdf .= "trailer\n<</Size {$size}/Root 1 0 R>>\nstartxref\n{$xref}\n%%EOF";

        return $pdf;
    }
}
