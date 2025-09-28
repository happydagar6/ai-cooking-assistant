import { OpenAIService } from "@/lib/openai";
import { NextResponse } from "next/server";


// Generate speech audio from text using OpenAI's TTS
export async function POST(request){
    try {
        const { text, voice = 'nova', speed = 1.0 } = await request.json();

        if(!text || typeof text !== 'string'){
            return NextResponse.json({ error: 'Text is required'}, { status: 400 });
        }

        if(text.length > 2000) {
            return NextResponse.json({ error: 'Text too long. Maximum 2000 characters.'}, { status: 400 });
        }

        const audioBuffer = await OpenAIService.generateSpeech(text, voice, speed);

        return new NextResponse(audioBuffer, {
            headers: {
                'Content-Type': 'audio/mpeg',
                'Content-Length': audioBuffer.length.toString(),
                'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
                'Accept-Ranges': 'bytes',
            },
        })
    } catch (error) {
        console.error('Speech API Error:', error);
        return NextResponse.json(
            { error: 'Failed to generate speech'}, 
            { status: 500 }
        )
    }
}