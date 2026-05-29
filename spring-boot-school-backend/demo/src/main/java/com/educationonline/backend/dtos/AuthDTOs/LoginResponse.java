package com.educationonline.backend.dtos.AuthDTOs;



public class LoginResponse {
 
    private String token;
    private String tokenType;
    private Long userId;
    private String email;
    private String name;
    private String accountType;
    private String redirectUrl;

    //student info seen only if the user is a student
    private studentInfo student;

    //teacher info seen only if the user is a teacher
    private teacherInfo teacher;



    public LoginResponse() {
    }

    public LoginResponse(String token,String tokenType,Long userId , String email, String name, String accountType , String redirectUrl) {
        this.token = token;
        this.tokenType = tokenType;
        this.userId = userId;
        this.email = email;
        this.name = name;
        this.accountType = accountType;
        this.redirectUrl = redirectUrl;
    }

    //student constructor with student info
    public LoginResponse(String token,String tokenType ,Long userId , String email, String name, String accountType,String redirectUrl ,studentInfo student) {
        this.token = token;
        this.tokenType = tokenType;
        this.userId = userId;
        this.email = email;
        this.name = name;
        this.accountType = accountType;
        this.redirectUrl = redirectUrl;
        this.student = student;
    }

    public studentInfo getStudent() {
        return student;
    }
    public void setStudent(studentInfo student) {
        this.student = student;
    }

    //teacher constructor with teacher info
    public LoginResponse(String token,Long userId , String email, String name, String accountType , teacherInfo teacher) {
        this.token = token;
        this.userId = userId;
        this.email = email;
        this.name = name;
        this.accountType = accountType;
        this.teacher = teacher;
    }

    public teacherInfo getTeacher() {
        return teacher;
    }
    public void setTeacher(teacherInfo teacher) {
        this.teacher = teacher;
    }


    public static class studentInfo {
        private String studentLevel;
        private String year;
        private String stream;
        private String substream;
        private boolean isTechMath;

        public studentInfo() {
        }

         public studentInfo(String studentLevel) {
            this.studentLevel = studentLevel;
         }

          public studentInfo(String studentLevel, String year) {
             this.studentLevel = studentLevel;
             this.year = year;
            
            }


        public studentInfo(String studentLevel, String year, String stream, String substream, boolean isTechMath) {
            this.studentLevel = studentLevel;
            this.year = year;
            this.stream = stream;
            this.substream = substream;
            this.isTechMath = isTechMath;
        }

        public boolean isTechMath() {
            return isTechMath;
        }

        public void setIsTechMath(boolean techMath) {
            isTechMath = techMath;
        }

        public String getStudentLevel() {
            return studentLevel;
        }

        public void setStudentLevel(String studentLevel) {
            this.studentLevel = studentLevel;
        }

        public String getYear() {
            return year;
        }
        public void setYear(String year) {
            this.year = year;
        }

        public String getStream() {
            return stream;
        }

        public void setStream(String stream) {
            this.stream = stream;
        }

        public String getSubstream() {
            return substream;
        }

        public void setSubstream(String substream) {
            this.substream = substream;
        }



        
    }
    public static class teacherInfo {
    
        private String subject;

        public teacherInfo(String subject) {
            this.subject = subject;
        }

        public String getSubject() {
            return subject;
        }

        public void setSubject(String subject) {
            this.subject = subject;
        }
        
    }
    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getAccountType() {
        return accountType;
    }

    public void setAccountType(String accountType) {
        this.accountType = accountType;
    }

    public String getTokenType() {
        return tokenType;
    }

    public void setTokenType(String tokenType) {
        this.tokenType = tokenType;
    }

    public String getRedirectUrl() {
        return redirectUrl;
    }

    public void setRedirectUrl(String redirectUrl) {
        this.redirectUrl = redirectUrl;
    }
}
