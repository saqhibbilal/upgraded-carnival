"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Eye, Users, FileText, TrendingUp, Target, Award, Calendar, MessageSquare } from "lucide-react"

interface HRInterviewDetailsModalProps {
  report: {
    id: string
    session_id: string
    resume_analysis: any
    interview_responses: any[]
    hr_evaluation: any
    behavioral_metrics: any
    created_at: string
  }
  children: React.ReactNode
}

export function HRInterviewDetailsModal({ 
  report, 
  children 
}: HRInterviewDetailsModalProps) {
  const [isOpen, setIsOpen] = useState(false)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 80) return "default"
    if (score >= 60) return "secondary"
    return "destructive"
  }

  const getOverallScore = () => {
    return report.behavioral_metrics?.overallScore || 0
  }

  const getConfidenceLevel = () => {
    return report.behavioral_metrics?.confidenceLevel || 0
  }

  const getAttentionSpan = () => {
    return report.behavioral_metrics?.attentionSpan || 0
  }

  const getProfessionalismScore = () => {
    return report.behavioral_metrics?.professionalismScore || 0
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            HR Interview Report Details
          </DialogTitle>
          <DialogDescription>
            Detailed analysis of your HR interview performance
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Interview Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Interview Overview</span>
                <Badge variant={getScoreBadgeVariant(getOverallScore())} className="text-lg px-3 py-1">
                  {getOverallScore()}%
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Interview Type</p>
                  <p className="text-lg font-semibold">HR Interview</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Completed</p>
                  <p className="text-lg font-semibold">{formatDate(report.created_at)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Session ID</p>
                  <p className="text-sm font-mono text-muted-foreground">{report.session_id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <Badge variant={getOverallScore() >= 60 ? "default" : "destructive"}>
                    {getOverallScore() >= 60 ? "PASS" : "NEEDS IMPROVEMENT"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Performance Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Performance Metrics
              </CardTitle>
              <CardDescription>
                Behavioral analysis and performance indicators
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-primary">{getOverallScore()}%</div>
                  <div className="text-sm text-muted-foreground">Overall Score</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{getConfidenceLevel()}%</div>
                  <div className="text-sm text-muted-foreground">Confidence Level</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{getAttentionSpan()}%</div>
                  <div className="text-sm text-muted-foreground">Attention Span</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{getProfessionalismScore()}%</div>
                  <div className="text-sm text-muted-foreground">Professionalism</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Resume Analysis */}
          {report.resume_analysis && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Resume Analysis
                </CardTitle>
                <CardDescription>
                  AI analysis of your resume for interview preparation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Experience Level</p>
                    <p className="text-lg font-semibold">
                      {report.resume_analysis.experienceLevel || 'Not specified'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Questions Generated</p>
                    <p className="text-lg font-semibold">
                      {report.interview_responses?.length || 0} Personalized Questions
                    </p>
                  </div>
                </div>
                
                {report.resume_analysis.hrProfile?.primaryStrengths && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Primary Strengths Identified</p>
                    <div className="flex flex-wrap gap-2">
                      {report.resume_analysis.hrProfile.primaryStrengths.map((strength: string, index: number) => (
                        <Badge key={index} variant="secondary">
                          {strength}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Interview Q&A */}
          {report.interview_responses && report.interview_responses.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Interview Questions & Answers
                </CardTitle>
                <CardDescription>
                  Your responses to HR interview questions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {report.interview_responses.map((response, index) => (
                  <div key={response.questionId || index} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-medium text-lg">Question {index + 1}</h4>
                      <Badge variant={response.hasResponse ? "default" : "secondary"}>
                        {response.hasResponse ? "Answered" : "No Response"}
                      </Badge>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Question:</p>
                        <p className="text-sm bg-muted p-3 rounded-md">
                          {response.questionText || 'Question text not available'}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Your Response:</p>
                        <p className="text-sm bg-muted p-3 rounded-md">
                          {response.userResponse && response.userResponse.trim() 
                            ? response.userResponse 
                            : '[No response recorded]'
                          }
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                        <div>
                          <span className="font-medium">Timestamp:</span> {response.timestamp ? new Date(response.timestamp).toLocaleString() : 'N/A'}
                        </div>
                        <div>
                          <span className="font-medium">Length:</span> {response.responseLength || 0} words
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* HR Evaluation (Future Phase 4) */}
          {report.hr_evaluation && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  HR Evaluation
                </CardTitle>
                <CardDescription>
                  AI evaluation of your interview responses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <Award className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>HR Q&A Evaluation coming in Phase 4</p>
                  <p className="text-sm">This will include detailed analysis of your responses</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Behavioral Analysis Details */}
          {report.behavioral_metrics && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Detailed Behavioral Analysis
                </CardTitle>
                <CardDescription>
                  Comprehensive analysis of your interview behavior
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                      <span className="text-sm font-medium">Eye Contact</span>
                      <span className="font-bold">{report.behavioral_metrics.avgEyeContact || 0}%</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                      <span className="text-sm font-medium">Stability Score</span>
                      <span className="font-bold">{Math.round((report.behavioral_metrics.stabilityScore || 0) * 100) / 100}%</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                      <span className="text-sm font-medium">Emotional Range</span>
                      <span className="font-bold">{Math.round((report.behavioral_metrics.emotionalRange || 0) * 100) / 100}%</span>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                      <span className="text-sm font-medium">Tech Quality</span>
                      <span className="font-bold">{report.behavioral_metrics.techQuality || 0}%</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                      <span className="text-sm font-medium">Attention Span</span>
                      <span className="font-bold">{report.behavioral_metrics.attentionSpan || 0}%</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                      <span className="text-sm font-medium">Professionalism</span>
                      <span className="font-bold">{report.behavioral_metrics.professionalismScore || 0}%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
