# Courses belong to the institution, their rules to the curriculum

A course (code, name, description, credits) belongs to its institution and is shared by every curriculum that includes it, so programs that share courses, such as the engineering programs of UDP, do not repeat them. What a curriculum decides about a course lives in the curriculum course instead: its prerequisites, the minimum approved credits it requires, its duration and whether it is an elective. Areas and tracks also belong to the curriculum.

We split it this way because the JSON files, which reused course ids across programs, disagreed for the same course in prerequisites, credits and elective flag, and because a prerequisite only makes sense within one curriculum. The same course can also sit in different areas in different curriculums: Marketing is a required professional course in Ingeniería Civil Industrial and a general education option in Psicología.
