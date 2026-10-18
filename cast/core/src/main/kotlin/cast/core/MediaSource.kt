package cast.core

import java.io.File
import java.io.InputStream
import java.io.RandomAccessFile

/** Un film à servir à la TV. */
interface MediaSource {
    val name: String
    val length: Long
    val mime: String

    /** Flux qui commence à l'octet [offset]. L'appelant le ferme. */
    fun open(offset: Long): InputStream
}

class FileMediaSource(private val file: File, override val mime: String = Mime.forName(file.name)) : MediaSource {
    override val name: String get() = file.name
    override val length: Long get() = file.length()

    override fun open(offset: Long): InputStream {
        val raf = RandomAccessFile(file, "r")
        raf.seek(offset)
        return object : InputStream() {
            override fun read(): Int = raf.read()
            override fun read(b: ByteArray, off: Int, len: Int): Int = raf.read(b, off, len)
            override fun close() = raf.close()
        }
    }
}

object Mime {
    private val byExtension = mapOf(
        "mp4" to "video/mp4", "m4v" to "video/mp4",
        "mkv" to "video/x-matroska", "webm" to "video/webm",
        "avi" to "video/x-msvideo", "mov" to "video/quicktime",
        "wmv" to "video/x-ms-wmv", "ts" to "video/mp2t", "m2ts" to "video/mp2t",
        "mpg" to "video/mpeg", "mpeg" to "video/mpeg", "3gp" to "video/3gpp", "flv" to "video/x-flv"
    )

    fun forName(name: String): String =
        byExtension[name.substringAfterLast('.', "").lowercase()] ?: "video/mp4"
}
