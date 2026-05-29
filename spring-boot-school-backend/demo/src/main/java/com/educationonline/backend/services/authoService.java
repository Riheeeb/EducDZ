package com.educationonline.backend.services;

import javax.security.auth.Subject;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import com.educationonline.backend.entities.*;
import com.educationonline.backend.repositories.*;

import jakarta.transaction.Transactional;

import com.educationonline.backend.dtos.AuthDTOs.AuthResponse;
import com.educationonline.backend.dtos.AuthDTOs.LoginRequest;
import com.educationonline.backend.dtos.AuthDTOs.LoginResponse;
import com.educationonline.backend.dtos.AuthDTOs.StudentRegisterRequest;
import com.educationonline.backend.dtos.AuthDTOs.TeacherRegisterRequest;





@Service
public class authoService {

    private final usersRepository userRepo;
    private final studentRepository studentRepo;
    private final teachersRepository teacherRepo;
    private final sbjectsRepository subjectRepo;
    private final StreamRepository streamRepo;
    private final substreamRepository substreamRepo;
   
    private final yearRepo yearsRepository;
    private BCryptPasswordEncoder passwordEncoder ;

    private final JwtService  jwtService;
    



    public authoService(usersRepository userRepo,studentRepository studentRepo , teachersRepository teacherRepo, sbjectsRepository subjectRepo, 
        substreamRepository substreamRepo, StreamRepository streamRepo,  yearRepo yearsRepository,
         BCryptPasswordEncoder passwordEncoder,JwtService jwtService ) {
        this.userRepo = userRepo;
        this.studentRepo = studentRepo;
        this.teacherRepo = teacherRepo;
        this.subjectRepo = subjectRepo;
        this.streamRepo = streamRepo;
        this.substreamRepo = substreamRepo;
      
        this.yearsRepository = yearsRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;

    }
    // register new student

    @Transactional
    public AuthResponse addNewStudent(StudentRegisterRequest student){
        if(userRepo.existsByEmail(student.getEmail())){
            throw new IllegalArgumentException("email already exists");
        }
        
       

        users user = new users(); // new user to put the info of student that comes from the request
        user.setName(student.getName());
        user.setEmail(student.getEmail());
        user.setPassword(passwordEncoder.encode(student.getPassword()));
        user.setAccountType(AccountType.STUDENT);
        users save_user = userRepo.save(user);

        // creation of student profile
       
        Years year = yearsRepository.findById(student.getYearId())
            .orElseThrow(() -> new IllegalArgumentException("Year not found "));

          //save_student have the info that will be saved in DB (means that user is student and have the same id of user)
        students save_student = new students();
        save_student.setUserS(save_user);
        Years.yearValue studentYear = year.getYear();
if (studentYear.isMiddleSchool()) {
            save_student.setStudentLevel(StudentLevel.MIDDLE_SCHOOL);
            Streams stream = streamRepo.findByStreamTypeIsNullAndYearId(year.getId())
                .orElseThrow(() -> new IllegalArgumentException("Stream not found for middle school year"));
             save_student.setStreams(stream);
             save_student.setSubstream(null);
           // else is high school  
        } else {
            save_student.setStudentLevel(StudentLevel.HIGH_SCHOOL);

            if (student.getStreamTypeId() != null) {
                 Streams stream = streamRepo.findByStreamTypeIdAndYearId(student.getStreamTypeId(), year.getId())
                .orElseThrow(() -> new IllegalArgumentException("Stream not found ")); 
                 save_student.setStreams(stream);

                 if (student.getSubstreamId() != null) {
                substream substream = substreamRepo.findById(student.getSubstreamId())
                    .orElseThrow(() -> new IllegalArgumentException("Substream not found"));
 
                    if (substream.getStreams() == null) {
                        throw new IllegalArgumentException("This substream is not associated with any stream");
                    }

                    // Check if the substream belongs to the selected stream
                    if (!substream.getStreams().getId().equals(stream.getId()) ) {
                        throw new IllegalArgumentException("Substream does not belong to the selected stream");
                    }else{
                    
                        String streamName = substream.getStreams().getStreamType().getNamestream();
                        if (streamName == null) {
                            throw new IllegalArgumentException("The stream type associated with this substream does not have a name");
                        }

                       

                        if (streamName.equalsIgnoreCase("Technique-mathe")) {
                            save_student.setSubstream(substream);
                        }else {
                            throw new IllegalArgumentException("Substream can only be assigned for Tech-Math stream");
                        }
                    }
                    
                } 
            else {
                save_student.setSubstream(null);
            }
                 // dont save YEAR and STREAM_TYPE in student table because they are in stream table  
            }else{
          throw new IllegalArgumentException("Stream type is required for high school students");

            }
        }
      
        
            studentRepo.save(save_student);
       
        

        return new AuthResponse(user.getId(),user.getEmail(), user.getName(), user.getAccountType());
    }

    // register new teacher

    @Transactional
    public AuthResponse addNewTeacher(TeacherRegisterRequest teacher){
        if(userRepo.existsByEmail(teacher.getEmail())){
            throw new IllegalStateException("email already exists");
        }
        users user = new users();
        user.setName(teacher.getName());
        user.setEmail(teacher.getEmail());
        user.setPassword(passwordEncoder.encode(teacher.getPassword()));
        user.setAccountType(AccountType.TEACHER);

        users save_user = userRepo.save(user);

        
        if (teacher.getTeacherSubjectId() == null) {
            throw new IllegalStateException("Teacher subject is required");
        }

        subjects subject = subjectRepo.findById(teacher.getTeacherSubjectId())
            .orElseThrow(() -> new IllegalStateException("Subject not found"));

        teachers save_teacher = new teachers();
        save_teacher.setUserT(save_user);
        save_teacher.setSubject(subject);
        teacherRepo.save(save_teacher); 

        return new AuthResponse(user.getId(),user.getEmail(), user.getName(), user.getAccountType());

    }


// LOGIN function for users
 
public LoginResponse login(LoginRequest request){
     try{ 
        users user = userRepo.findByEmail(request.getEmail()).orElseThrow(() -> new IllegalArgumentException("User not found with email: " + request.getEmail()));
        if (user == null) {
            throw new IllegalArgumentException("User not found with email: " + request.getEmail());
        }
           
        
       
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Invalid password");
        }

        if (!user.isEnabled()) {
            throw new IllegalArgumentException("User account is banned");
        }
       
        //if user exist create JWT token
        String token = jwtService.generateToken(user);

        AccountType Type = user.getAccountType();   

        LoginResponse response = new LoginResponse();
        response.setToken(token);
        response.setTokenType("Bearer");
        response.setUserId(user.getId());
        response.setEmail(user.getEmail());
        response.setName(user.getName());
        response.setAccountType(Type.toString());

        if(Type == AccountType.STUDENT){
            students student = studentRepo.findByUserSId(user.getId());
            if (student != null) {
                LoginResponse.studentInfo studentInfo = new LoginResponse.studentInfo();
                studentInfo.setStudentLevel(student.getStudentLevel().toString());
                if (student.getStreams().getYear() != null) {
                   
                        studentInfo.setYear(student.getStreams().getYear().getYear().getValue());
                    
                }
                if (student.getStreams() != null && student.getStreams().getStreamType() != null) {
                    studentInfo.setStream(student.getStreams().getStreamType().getNamestream());

                    studentInfo.setIsTechMath(student.getStreams().getStreamType().getNamestream().equalsIgnoreCase("tech-math"));
                }

                if (student.getSubstream() != null) {
                    studentInfo.setSubstream(student.getSubstream().getNameSubstream());
                }else {
                    studentInfo.setSubstream(null);
                }
                
                response.setStudent(studentInfo);
                response.setRedirectUrl("/student/dashboard");
            }
        } else if(Type == AccountType.TEACHER){
            teachers teacher = teacherRepo.findByUserTId(user.getId());
            if (teacher != null) {
                LoginResponse.teacherInfo teacherInfo = new LoginResponse.teacherInfo(
                    teacher.getSubject().getName()
                );
                response.setTeacher(teacherInfo);
                response.setRedirectUrl("/teacher/dashboard");
            }else{
                response.setRedirectUrl("/admin/dashboard");
            }
        }
        return response;
    } catch (IllegalStateException e) {
        throw e;
    } catch (Exception e) {
        throw new IllegalStateException("An error occurred during login" + e.getMessage());
    }
}
}




       



    



    
     



