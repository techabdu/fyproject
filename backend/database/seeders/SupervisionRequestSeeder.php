<?php

namespace Database\Seeders;

use App\Enums\RequestStatus;
use App\Models\SupervisionRequest;
use App\Models\SupervisorProfile;
use App\Models\User;
use Illuminate\Database\Seeder;

class SupervisionRequestSeeder extends Seeder
{
    public function run(): void
    {
        // ----- ACCEPTED (consumes one of Dr. Bello's capacity slots) -----
        $this->request(
            student: 'bilal.yakubu@student.abu.edu.ng',
            supervisor: 'aisha.bello@abu.edu.ng',
            title: 'Real-Time Mask Detection Using Deep Learning',
            summary: 'A deep learning system that detects whether people are wearing face masks in real time from a video stream, intended for entrance monitoring.',
            keywords: 'computer vision, deep learning, image classification',
            status: RequestStatus::Accepted,
            reason: 'Strong proposal that aligns closely with my computer vision research. Happy to supervise.',
        );

        // ----- PENDING (awaiting Dr. Sani's decision) --------------------
        $this->request(
            student: 'ahmad.dalhat@student.abu.edu.ng',
            supervisor: 'yusuf.sani@abu.edu.ng',
            title: 'A Supervisor Matching Platform Using Keyword Overlap Scoring',
            summary: 'A web platform that matches final year students to supervisors using a transparent keyword-overlap score, with a project repository and supervision request workflow.',
            keywords: 'natural language processing, machine learning, data science, web development',
            status: RequestStatus::Pending,
            reason: null,
        );

        // ----- DECLINED (with reason; frees the student) -----------------
        $this->request(
            student: 'chioma.nwosu@student.abu.edu.ng',
            supervisor: 'musa.ibrahim@abu.edu.ng',
            title: 'Phishing URL Detection with Machine Learning',
            summary: 'A classifier that flags phishing URLs from lexical and host-based features, evaluated against a public phishing dataset.',
            keywords: 'cybersecurity, machine learning, intrusion detection',
            status: RequestStatus::Declined,
            reason: 'I am fully committed this session and cannot take on another student. Dr. Bello may be a good fit given the ML focus.',
        );
    }

    private function request(string $student, string $supervisor, string $title, string $summary, string $keywords, RequestStatus $status, ?string $reason): void
    {
        $studentUser = User::where('email', $student)->first();
        $supervisorUser = User::where('email', $supervisor)->first();

        SupervisionRequest::create([
            'student_id' => $studentUser->id,
            'supervisor_id' => $supervisorUser->id,
            'proposed_title' => $title,
            'proposal_summary' => $summary,
            'proposal_keywords' => $keywords,
            'status' => $status,
            'decision_reason' => $reason,
        ]);

        // Keep current_load consistent with accepted requests.
        if ($status === RequestStatus::Accepted) {
            SupervisorProfile::where('user_id', $supervisorUser->id)->increment('current_load');
        }
    }
}
