# Task: Fix Spring Boot JPA startup error - QuestionOption JdbcType issue

## Steps from approved plan:

### 1. [COMPLETED] Update QuestionOption.java
- Convert to @Embeddable
- Remove @Id, @GeneratedValue, @ManyToOne to QuizQuestion
- Keep @Column annotations on fields: optionText, optionIndex
- Ensure lombok annotations are present

### 2. [COMPLETED] Update QuizQuestion.java
- Remove the @Column(name = "option_text", nullable = false) from the options @ElementCollection
- Keep @ElementCollection, @CollectionTable, @OrderColumn unchanged

### 3. [PENDING] Clean and rebuild project
- Run: mvn clean compile

### 4. [PENDING] Test application startup
- Run: mvn spring-boot:run
- Verify no JPA EntityManagerFactory errors

### 5. [PENDING] [COMPLETED] Attempt completion

