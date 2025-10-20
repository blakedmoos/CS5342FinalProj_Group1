import { Shield, BookOpen, Brain, Users, Lock, Database } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DatabaseStatus } from "@/components/database-status"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-balance">NetSec Tutor</h1>
            </div>
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/tutor" className="text-sm font-medium hover:text-blue-600 transition-colors">
                Q&A Tutor
              </Link>
              <Link href="/quiz" className="text-sm font-medium hover:text-blue-600 transition-colors">
                Quiz Bot
              </Link>
              <Link href="/admin" className="text-sm font-medium hover:text-blue-600 transition-colors">
                Admin
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-5xl font-bold mb-6 text-balance">AI-Powered Network Security Learning Platform</h2>
            <p className="text-xl text-muted-foreground mb-8 text-pretty max-w-2xl mx-auto">
              Master network security concepts with our privacy-preserving local LLM tutor. Get personalized answers and
              take adaptive quizzes with detailed citations.
            </p>
            
            {/* Database Status Component */}
            <div className="mb-8 max-w-2xl mx-auto">
              <DatabaseStatus />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700">
                <Link href="/tutor">
                  <BookOpen className="mr-2 h-5 w-5" />
                  Start Learning
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/quiz">
                  <Brain className="mr-2 h-5 w-5" />
                  Take Quiz
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 px-4 bg-muted/50">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold mb-4">Privacy-First Learning</h3>
            <p className="text-muted-foreground max-w-2xl mx-auto text-pretty">
              All data processing happens locally on your machine. No sensitive information leaves your system.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <BookOpen className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle>Q&A Tutor Agent</CardTitle>
                <CardDescription>
                  Get instant answers to network security questions with detailed citations from your local knowledge
                  base.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• Contextual answers with citations</li>
                  <li>• Local document processing</li>
                  <li>• Web reference integration</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <Brain className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle>Quiz Generation Bot</CardTitle>
                <CardDescription>
                  Adaptive quizzes with multiple question types and intelligent grading with detailed feedback.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• Multiple choice questions</li>
                  <li>• True/false assessments</li>
                  <li>• Open-ended evaluations</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <Lock className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle>Privacy & Security</CardTitle>
                <CardDescription>
                  Complete data privacy with local processing. Your network security documents never leave your system.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• Local LLM processing</li>
                  <li>• Vector database storage</li>
                  <li>• No data transmission</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Technical Architecture */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold mb-4">Built for CS5342 Network Security</h3>
            <p className="text-muted-foreground max-w-2xl mx-auto text-pretty">
              Designed specifically for academic use with comprehensive network security curriculum integration.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Database className="h-8 w-8 text-blue-600" />
              </div>
              <h4 className="font-semibold mb-2">Vector Database</h4>
              <p className="text-sm text-muted-foreground">Local embeddings storage for fast document retrieval</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Brain className="h-8 w-8 text-green-600" />
              </div>
              <h4 className="font-semibold mb-2">Local LLM</h4>
              <p className="text-sm text-muted-foreground">Open-source language model running locally</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-purple-600" />
              </div>
              <h4 className="font-semibold mb-2">Security Focus</h4>
              <p className="text-sm text-muted-foreground">Network security curriculum and materials</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-orange-600" />
              </div>
              <h4 className="font-semibold mb-2">Group Project</h4>
              <p className="text-sm text-muted-foreground">Collaborative development for CS5342</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-4 bg-muted/30">
        <div className="container mx-auto text-center">
          <p className="text-sm text-muted-foreground">
            CS5342 Network Security Group Project - Privacy-Preserving AI Tutor
          </p>
        </div>
      </footer>
    </div>
  )
}
