package com.educationonline.backend.Config;

import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.ResultSet;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import javax.sql.DataSource;

import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import com.educationonline.backend.entities.users;
import com.educationonline.backend.repositories.usersRepository;
import com.educationonline.backend.entities.AccountType;
import com.educationonline.backend.entities.StudentLevel;
import com.educationonline.backend.entities.Years;
import com.educationonline.backend.entities.Years.yearValue;
import com.educationonline.backend.entities.stream_type;
import com.educationonline.backend.entities.subjects;
import com.educationonline.backend.entities.substream;
import com.educationonline.backend.entities.Streams;
import com.educationonline.backend.repositories.StreamRepository;
import com.educationonline.backend.repositories.StreamTypeRepo;
import com.educationonline.backend.repositories.sbjectsRepository;
import com.educationonline.backend.repositories.substreamRepository;
import com.educationonline.backend.repositories.yearRepo;

@Component
public class DataInitializer implements CommandLineRunner {

    
    private final StreamRepository streamRepository;
    private final sbjectsRepository subjectsRepository;
    private final yearRepo yearRepo;
    private final StreamTypeRepo streamTypeRepo;
    private final substreamRepository substreamRepo;
    private final usersRepository userRepository;
    private final DataSource dataSource;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(StreamRepository streamRepository, 
        sbjectsRepository subjectsRepository, yearRepo yearRepo,
         StreamTypeRepo streamTypeRepo, substreamRepository substreamRepo,usersRepository userRepository,
         DataSource dataSource, PasswordEncoder passwordEncoder) {
             
        
        this.streamRepository = streamRepository;
        this.subjectsRepository = subjectsRepository;
        this.yearRepo = yearRepo;
        this.streamTypeRepo = streamTypeRepo;
        this.substreamRepo = substreamRepo;
        this.userRepository = userRepository;
        this.dataSource = dataSource;
        this.passwordEncoder = passwordEncoder;
    }

    // #region agent log
    private static java.nio.file.Path resolveDebugLogPath() {
        java.nio.file.Path cwd = java.nio.file.Path.of(System.getProperty("user.dir", ".")).toAbsolutePath().normalize();
        if (cwd.getFileName() != null && "demo".equalsIgnoreCase(cwd.getFileName().toString())) {
            cwd = cwd.getParent();
        }
        return cwd.resolve(".cursor").resolve("debug.log");
    }

    private void agentLog(String hypothesisId, String location, String message, Map<String, Object> data) {
        try {
            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("hypothesisId", hypothesisId);
            payload.put("location", location);
            payload.put("message", message);
            payload.put("data", data != null ? data : Map.of());
            payload.put("timestamp", System.currentTimeMillis());
            payload.put("runId", "pre-fix");
            String json = new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(payload);
            java.nio.file.Files.writeString(resolveDebugLogPath(), json + System.lineSeparator(),
                java.nio.file.StandardOpenOption.CREATE, java.nio.file.StandardOpenOption.APPEND);
        } catch (Exception ignored) {
        }
    }

    private void logJdbcTableColumns(String hypothesisId, String tableName) {
        List<Map<String, String>> columns = new ArrayList<>();
        try (Connection c = dataSource.getConnection()) {
            String catalog = c.getCatalog();
            DatabaseMetaData md = c.getMetaData();
            try (ResultSet rs = md.getColumns(catalog, null, tableName, null)) {
                while (rs.next()) {
                    Map<String, String> col = new LinkedHashMap<>();
                    col.put("name", rs.getString("COLUMN_NAME"));
                    col.put("nullable", rs.getString("IS_NULLABLE"));
                    col.put("type", rs.getString("TYPE_NAME"));
                    columns.add(col);
                }
            }
            agentLog(hypothesisId, "DataInitializer.logJdbcTableColumns",
                "JDBC columns for table " + tableName,
                Map.of("catalog", String.valueOf(catalog), "table", tableName, "columns", columns));
        } catch (Exception e) {
            agentLog(hypothesisId, "DataInitializer.logJdbcTableColumns",
                "JDBC metadata failed for " + tableName,
                Map.of("table", tableName, "error", e.toString()));
        }
    }
    // #endregion

     private void inityears(){

            yearRepo.save(new Years(yearValue.Y1_AM,StudentLevel.MIDDLE_SCHOOL));
            yearRepo.save(new Years(yearValue.Y2_AM,StudentLevel.MIDDLE_SCHOOL));
            yearRepo.save(new Years(yearValue.Y3_AM,StudentLevel.MIDDLE_SCHOOL));
            yearRepo.save(new Years(yearValue.Y4_AM,StudentLevel.MIDDLE_SCHOOL));
            yearRepo.save(new Years(yearValue.Y1_AS,StudentLevel.HIGH_SCHOOL));
            yearRepo.save(new Years(yearValue.Y2_AS,StudentLevel.HIGH_SCHOOL));
            yearRepo.save(new Years(yearValue.Y3_AS,StudentLevel.HIGH_SCHOOL));


        }

    private void initStreamTypes() {
streamTypeRepo.save(new stream_type("Science Experimentale"));
        streamTypeRepo.save(new stream_type(" Mathematique"));
        streamTypeRepo.save(new stream_type("Technique-mathe"));
        streamTypeRepo.save(new stream_type("Langues étrangères"));
        streamTypeRepo.save(new stream_type("Economie et gestion"));
        streamTypeRepo.save(new stream_type("Lettres et Phylosophie"));
        
    }

    private void initStreams(){
 
        List<stream_type> streamTypes = streamTypeRepo.findAll();
        List<Years> years1 = yearRepo.findAll();
        for (Years level : years1) {
            if (level.getYearType() == StudentLevel.HIGH_SCHOOL) {
                for (stream_type streamType : streamTypes) {
                    if (level.getYear() == yearValue.Y1_AS) {
                        if ("Science Experimentale".equals(streamType.getNamestream())
                                || "Lettres et Phylosophie".equals(streamType.getNamestream())) {
                            // #region agent log
                            Map<String, Object> d1 = new LinkedHashMap<>();
                            d1.put("yearId", level.getId());
                            d1.put("streamTypeId", streamType.getId());
                            d1.put("streamTypeName", streamType.getNamestream());
                            agentLog("D", "DataInitializer.initStreams", "save Streams (Y1_AS filtered)", d1);
                            // #endregion
                            streamRepository.save(new Streams(streamType, level));
                        }
                    } else {
                        // #region agent log
                        Map<String, Object> d2 = new LinkedHashMap<>();
                        d2.put("yearId", level.getId());
                        d2.put("streamTypeId", streamType.getId());
                        d2.put("streamTypeName", streamType.getNamestream());
                        agentLog("D", "DataInitializer.initStreams", "save Streams (high school non-Y1_AS)", d2);
                        // #endregion
                        streamRepository.save(new Streams(streamType, level));
                    }
                }
            } else {
                // #region agent log
                Map<String, Object> d3 = new LinkedHashMap<>();
                d3.put("yearId", level.getId());
                d3.put("streamTypeNull", true);
                agentLog("D", "DataInitializer.initStreams", "save Streams (middle school, null streamType)", d3);
                // #endregion
                streamRepository.save(new Streams(null, level));
            }
        }
    }




    private void initSubjects() {
        subjectsRepository.save(new subjects(   "Mathematique"));
        subjectsRepository.save(new subjects("Physique"));
        subjectsRepository.save(new subjects("Arabe"));
        subjectsRepository.save(new subjects("Français"));
        subjectsRepository.save(new subjects("Anglais"));
        subjectsRepository.save(new subjects("Economie"));
        subjectsRepository.save(new subjects("Science naturelle"));
        subjectsRepository.save(new subjects("Philosophie"));
        subjectsRepository.save(new subjects("Civil"));
        subjectsRepository.save(new subjects("Mequanique"));
        subjectsRepository.save(new subjects("electrique"));
    }

    private void initSubStreams() {

        // substream has foreign key stream_id so we need to get streams first
        // streamtype is important to equal "Technique-mathe" to add substreams
        List<Streams> streams = streamRepository.findAll();
        for (Streams stream : streams) {
            if (stream.getStreamType() != null && stream.getStreamType().getNamestream().equals("Technique-mathe")) {
                substream sub1 = new substream("Genie Mecanique");
                sub1.setStreams(stream);
                substream sub2 = new substream("Genie Electrique");
                sub2.setStreams(stream);
                substream sub3 = new substream("Genie des Procédés");
                sub3.setStreams(stream);
                substream sub4 = new substream("Genie Civil");
                sub4.setStreams(stream);

                substreamRepo.save(sub1);
                substreamRepo.save(sub2);
                substreamRepo.save(sub3);
                substreamRepo.save(sub4);
            }
            
        }
       
    }

    private void initAdmin() {
    if (userRepository.findByEmail("admin@gmail.com").isEmpty()) {

        users admin = new users();
        admin.setName("Admin1");
        admin.setEmail("admin@gmail.com");
        admin.setPassword(passwordEncoder.encode("123456789"));
        admin.setAccountType(AccountType.ADMIN);

        userRepository.save(admin);

        System.out.println("Admin created!");
    } 
}

    @Override
    public void run(String... args) {
        // #region agent log
        logJdbcTableColumns("A", "streams");
        logJdbcTableColumns("C", "stream_type");
        // #endregion
        // Initialise chaque table uniquement si elle est vide
        if (yearRepo.count() == 0) {
            inityears();
        }

        if (streamTypeRepo.count() == 0) {
            initStreamTypes();
        }

        if (streamRepository.count() == 0) {
            initStreams();
        }

        if (subjectsRepository.count() == 0) {
            initSubjects();
        }

        if (substreamRepo.count() == 0) {
            initSubStreams();
        }

        initAdmin();
    }



}
