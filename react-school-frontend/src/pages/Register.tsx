import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { GraduationCap, ArrowLeft, Mail, Lock, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import api from "@/services/api";
import { saveSession } from "@/services/authStorage";
import DecorativeBackground from "@/components/DecorativeBackground";
const Register = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  type YearOption = {
    id: number;
    name: string;
    yearType: string;
  };

  type StreamOption = {
    id: number;
    name: string;
    streamTypeId: number | null;
  };

  type SubstreamOption = {
    id: number;
    name: string;
  };

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    accountType: "",
    studentLevel: "",
    yearId: null as number | null,
    streamId: null as number | null,
    streamTypeId: null as number | null,
    substreamId: null as number | null,
    teacherSubjectId: null as number | null,
  });

  const [years, setYears] = useState<YearOption[]>([]);
  const [streams, setStreams] = useState<StreamOption[]>([]);
  const [substreams, setSubstreams] = useState<SubstreamOption[]>([]);
  const [subjects, setSubjects] = useState([]);

  const loadStreams = (yearId: number) => {
    api.get(`/years/${yearId}/streams`)
      .then((res) => {
        const data = res.data;
        const list = Array.isArray(data) ? data : data?.content ?? [];
        const normalizedStreams: StreamOption[] = list.map((stream: any) => ({
          id: Number(stream.id),
          name: stream.name ?? stream.namestream ?? stream.streamType?.namestream ?? "",
          streamTypeId: stream.streamTypeId != null ? Number(stream.streamTypeId) : null,
        }));
        console.log("STREAMS DATA:", normalizedStreams);
        setStreams(normalizedStreams);
      })
      .catch(() => {
        console.log("error loading streams");
        setStreams([]);
      });
  };

  const loadSubstreams = (streamId: number) => {
    api.get(`/substreams/by-stream/${streamId}`)
      .then((res) => {
        const data = res.data;
        const list = Array.isArray(data) ? data : data?.content ?? [];
        const normalizedSubstreams: SubstreamOption[] = list.map((substream: any) => ({
          id: Number(substream.id),
          name: substream.name ?? substream.nameSubstream ?? substream.namesubstream ?? "",
        }));
        setSubstreams(normalizedSubstreams);
      })
      .catch(() => {
        console.log("error loading substreams");
        setSubstreams([]);
      });
  };

  // load subjects for teacher
  useEffect(() => {
    api.get("/subjects").then((res) => {
      const data = res.data;
      console.log("API SUBJECTS:", res.data);
      if (Array.isArray(data)) {
        setSubjects(data);
      } else if (data.content) {
        setSubjects(data.content);
      } else {
        setSubjects([]);
      }
    }).catch(() => console.log("error loading subjects"));
  }, []);

  // load years
  useEffect(() => {
  api.get("/years")
    .then((res) => {
      // backend might return a Page object or a plain array
      const data = res.data;
      const list = Array.isArray(data) ? data : data.content ?? [];

      const normalizedYears: YearOption[] = list.map((year: any) => ({
        id: Number(year.id),
        name: year.name ?? year.year ?? "",
        yearType: year.yearType ?? "",
      }));

      if (Array.isArray(data)) {
        setYears(normalizedYears);
      } else if (data.content) {
        setYears(normalizedYears);
      } else {
        setYears([]);
      }
    })
    .catch(() => console.log("error loading years"));
}, []);

// load streams
useEffect(() => {
  if(!formData.yearId) return;
  if (formData.studentLevel !== "HIGH_SCHOOL") {
    setStreams([]);
    setSubstreams([]);
    return;
  }
  loadStreams(formData.yearId);
}, [formData.yearId]);


  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.name ||
      !formData.email ||
      !formData.password ||
      !formData.confirmPassword ||
      !formData.accountType
    ) {
      toast({
        title: "Missing fields",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    // student specific validation
    if (formData.accountType === "student") {
      if (!formData.studentLevel || !formData.yearId) {
        toast({
          title: "Missing fields",
          description: "Please fill in all student informations",
          variant: "destructive",
        });
        return;
      }

      if (formData.studentLevel === "HIGH_SCHOOL" && !formData.streamTypeId) {
        toast({
          title: "Missing fields",
          description: "Please choose a stream",
          variant: "destructive",
        });
        return;
      }

      const selectedStreamName = streams.find(
        (s) => s.id === formData.streamId
      )?.name;
      if (selectedStreamName === "Technique-mathe" && !formData.substreamId) {
        toast({
          title: "Missing fields",
          description: "Please select a substream",
          variant: "destructive",
        });
        return;
      }
    }

    // teacher specific validation
    if (formData.accountType === "teacher" && !formData.teacherSubjectId) {
      toast({
        title: "Missing fields",
        description: "Please select a subject",
        variant: "destructive",
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure your passwords match",
        variant: "destructive",
      });
      return;
    }

    try {
      const endpoint =
        formData.accountType === "student"
          ? "/auth/register/student"
          : "/auth/register/teacher";

      const data = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        studentLevel: formData.studentLevel || null,
        yearId: formData.yearId || null,
        streamTypeId: formData.streamTypeId || null,
        substreamId: formData.substreamId || null,
        teacherSubjectId: formData.teacherSubjectId || null,
      };

      console.log("TEACHER SUBJECT ID:", formData.teacherSubjectId);
      await api.post(endpoint, data);

      const loginResponse = await api.post("/auth/login", {
        email: formData.email,
        password: formData.password,
      });

      saveSession(loginResponse.data);

      toast({
        title: "Success",
        description: "Account created and logged in successfully",
      });

      const accountType: string = loginResponse.data.accountType;
      if (accountType === "STUDENT") {
        navigate("/deshboardStudent");
      } else if (accountType === "TEACHER") {
        navigate("/teacher-dashboard");
      } else {
        navigate("/");
      }
    } catch (error: any) {
      console.log("FULL ERROR:", error.response?.data);
      console.log(error.response);
      toast({
        title: "Registration failed",
        description: "Please verify your information and try again",
        variant: "destructive",
      });
    }
  };

  return (
<div className="min-h-screen relative overflow-hidden flex items-center justify-center"> 
        <div className="w-full max-w-md">

        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-6 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>

        {/* Register Card */}
        <Card className="border-2 shadow-xl">
          <CardHeader className="space-y-4 text-center">
            <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center">
              <GraduationCap className="h-8 w-8 text-primary" />
            </div>
            <div>
              <CardTitle className="text-3xl font-bold">Join EducDZ</CardTitle>
              <CardDescription className="text-base mt-2">
                Create an account to start your learning adventure
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleRegister} className="space-y-4">

              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-foreground">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Your full name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-foreground">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      setFormData({ ...formData, confirmPassword: e.target.value })
                    }
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Account Type */}
              <div className="space-y-2">
                <Label className="text-foreground">Sign-up as</Label>
                <RadioGroup
                  value={formData.accountType}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      accountType: value,
                      studentLevel: "",
                      yearId: null,
                      streamId: null,
                      streamTypeId: null,
                      substreamId: null,
                      teacherSubjectId: null,
                    })
                  }
                  className="flex items-center gap-6"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem id="student" value="student" />
                    <Label htmlFor="student">Student</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem id="teacher" value="teacher" />
                    <Label htmlFor="teacher">Teacher</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* ── STUDENT FIELDS ── */}
              {formData.accountType === "student" && (
                <div className="space-y-4">

                  {/* Student Level */}
                  <div className="space-y-2">
                    <Label>Level</Label>
                    <RadioGroup
                      value={formData.studentLevel}
                      onValueChange={(value) =>
                        setFormData({
                          ...formData,
                          studentLevel: value,
                          yearId: null,
                          streamId: null,
                          streamTypeId: null,
                          substreamId: null,
                        })
                      }
                      className="flex items-center gap-6"
                    >
                      <div className="flex items-center gap-2">
                        <RadioGroupItem id="moyen" value="MIDDLE_SCHOOL" />
                        <Label htmlFor="moyen">Middle School</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <RadioGroupItem id="secondary" value="HIGH_SCHOOL" />
                        <Label htmlFor="secondary">High School</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* MIDDLE SCHOOL — Year only */}
                  {formData.studentLevel === "MIDDLE_SCHOOL" && (
                    <div className="space-y-2">
                      <Label>Year</Label>
                      <Select
                        value={formData.yearId ? String(formData.yearId) : ""}
                        onValueChange={(value) => {
                          setFormData({
                            ...formData,
                            yearId: Number(value),
                            streamId: null,
                            streamTypeId: null,
                            substreamId: null,
                          });
                          setStreams([]);
                          setSubstreams([]);
                            console.log("RAW YEARS[0]:", value, years[0]);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose year" />
                        </SelectTrigger>
                        <SelectContent>
                          {years
  .filter((y) => y.yearType === "MIDDLE_SCHOOL")
  .map((y) => (
    <SelectItem key={y.id} value={String(y.id)}>
      {y.name}
    </SelectItem>
  ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* HIGH SCHOOL — Year + Stream + optional SubStream */}
                  {formData.studentLevel === "HIGH_SCHOOL" && (
                    <div className="space-y-4">

                      {/* Year */}
                      <div className="space-y-2">
                        <Label>Year</Label>
                        <Select
                          value={formData.yearId ? String(formData.yearId) : ""}
                          onValueChange={(value) => {
                            setFormData({
                              ...formData,
                              yearId: Number(value),
                              streamId: null,
                              streamTypeId: null,
                              substreamId: null,
                            });
                            setStreams([]);
                            setSubstreams([]);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Choose year" />
                          </SelectTrigger>
                          <SelectContent>
                            {years.filter((y) => y.yearType === "HIGH_SCHOOL").map((y) => (
                               <SelectItem key={y.id} value={String(y.id)}>
                               {y.name}
                          </SelectItem>
                        ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Stream — only after year is chosen */}
                      {formData.yearId && streams.length > 0 ? (
                        <div className="space-y-2">
                          <Label>Stream</Label>
                          <Select
                            value={formData.streamId ? String(formData.streamId) : ""}

                            onValueChange={(value) => {
                              if (!value) return;
                              const selectedStream = streams.find((s) => String(s.id) === value);
                              setFormData({
                                ...formData,
                                streamId: Number(value),
                                streamTypeId: selectedStream?.streamTypeId ?? null,
                                substreamId: null,
                              });
                              setSubstreams([]);
                              loadSubstreams(Number(value));
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Choose stream"/>
                            </SelectTrigger>
                            <SelectContent>
    {streams.map((s) => (
      <SelectItem key={s.id} value={String(s.id)}>
        {s.name}
      </SelectItem>
    ))}
  </SelectContent>

                          </Select>
                        </div>
                      ) : null}

                      {/* SubStream — only for Technique-mathe */}
                      {formData.yearId && formData.streamId && streams.find((s) => s.id === formData.streamId)?.name === "Technique-mathe" && (
                        <div className="space-y-2">
                          <Label>Sub Stream</Label>
                          <Select
                            value={
                              formData.substreamId
                                ? String(formData.substreamId)
                                : ""
                            }
                            onValueChange={(value) =>
                              setFormData({
                                ...formData,
                                substreamId: Number(value),
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select substream" />
                            </SelectTrigger>
                            <SelectContent>
                              {substreams.map((sub) => (
                                <SelectItem key={sub.id} value={String(sub.id)}>
                                  {sub.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ── TEACHER FIELDS ── */}
              {formData.accountType === "teacher" && (
                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Select
                    value={
                      formData.teacherSubjectId
                        ? String(formData.teacherSubjectId)
                        : ""
                    }
                    onValueChange={(value) =>{
                      console.log("SELECTED VALUE:", value);
                      setFormData({
                        ...formData,
                        teacherSubjectId: Number(value),
                      })
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((sub) => (
                        
                        <SelectItem key={sub.id} value={String(sub.id)}>
                          {sub.namesubject}
                        </SelectItem>
                        
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Submit */}
              <Button
                type="submit"
 className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-[var(--shadow-emerald)] transition-all hover:scale-[1.02]"                size="lg"
              >
                Create Account
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">Already have an account? </span>
              <button
                onClick={() => navigate("/login")}
                className="text-primary font-semibold hover:underline"
              >
                Login here
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Register;
