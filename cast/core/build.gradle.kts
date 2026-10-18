plugins {
    id("org.jetbrains.kotlin.jvm")
}

dependencies {
    testImplementation(kotlin("test"))
}

// Bytecode Java 17 : c'est ce que consomme le module Android.
tasks.withType<org.jetbrains.kotlin.gradle.tasks.KotlinCompile>().configureEach {
    kotlinOptions.jvmTarget = "17"
}
tasks.withType<JavaCompile>().configureEach { options.release.set(17) }

tasks.test { useJUnitPlatform() }
