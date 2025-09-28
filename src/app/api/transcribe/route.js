import { OpenAIService } from "@/lib/openai";
import { NextResponse } from "next/server";

// Transcribe audio file to text using OpenAI's Whisper
export async function POST(request) {
    // Handle multipart/form-data
    try {
        const formData = await request.formData(); // Parse form data
        const audioFile = formData.get('audio'); // Get audio file

        if(!audioFile || !(audioFile instanceof File)){ // if no file or not a File instance
            return NextResponse.json({
                error: 'Audio file is required'
            }, {
                status: 400
            })
        }
        const audioBuffer = await audioFile.arrayBuffer(); // Convert to ArrayBuffer
        const transcription = await OpenAIService.transcribeAudio(audioBuffer); // Transcribe using OpenAI

        return NextResponse.json({ transcription });
    } catch (error) {
        console.error('Transcription API Error:', error);
        return NextResponse.json(
            { error: 'Failed to transcribe audio' },
            { status: 500 }
        )
    }
};