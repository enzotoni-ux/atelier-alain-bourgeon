pluginManagement {
    repositories {
        gradlePluginPortal()
        google()
        mavenCentral()
    }
    // Versions déclarées une fois ici : elles ne sont résolues que si le plugin est appliqué.
    plugins {
        id("org.jetbrains.kotlin.jvm") version "1.9.24"
        id("org.jetbrains.kotlin.android") version "1.9.24"
        id("com.android.application") version "8.5.2"
    }
}

dependencyResolutionManagement {
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "cast"

include(":core")
// Le module Android n'est inclus qu'avec -Pandroid (CI) : le SDK Android n'existe pas partout,
// et le cœur doit pouvoir se compiler et se tester avec un simple JDK.
if (providers.gradleProperty("android").isPresent) include(":app")
