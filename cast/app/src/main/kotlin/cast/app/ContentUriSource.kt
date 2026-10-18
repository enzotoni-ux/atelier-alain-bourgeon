package cast.app

import android.content.ContentResolver
import android.net.Uri
import android.provider.OpenableColumns
import cast.core.MediaSource
import cast.core.Mime
import java.io.FileInputStream
import java.io.FilterInputStream
import java.io.IOException
import java.io.InputStream

/** Un film choisi dans le sélecteur de fichiers Android (content://…), lu à la demande de la TV. */
class ContentUriSource(private val resolver: ContentResolver, private val uri: Uri) : MediaSource {
    override val name: String
    override val length: Long
    override val mime: String

    init {
        var n: String? = null
        var size = -1L
        resolver.query(uri, arrayOf(OpenableColumns.DISPLAY_NAME, OpenableColumns.SIZE), null, null, null)?.use { c ->
            if (c.moveToFirst()) {
                val ni = c.getColumnIndex(OpenableColumns.DISPLAY_NAME)
                val si = c.getColumnIndex(OpenableColumns.SIZE)
                if (ni >= 0) n = c.getString(ni)
                if (si >= 0 && !c.isNull(si)) size = c.getLong(si)
            }
        }
        name = n ?: uri.lastPathSegment ?: "film"
        if (size < 0) size = resolver.openAssetFileDescriptor(uri, "r")?.use { it.length } ?: -1L
        length = size
        mime = resolver.getType(uri)?.takeIf { it.startsWith("video/") } ?: Mime.forName(name)
    }

    override fun open(offset: Long): InputStream {
        val pfd = resolver.openFileDescriptor(uri, "r") ?: throw IOException("Fichier illisible : $uri")
        val stream = FileInputStream(pfd.fileDescriptor)
        try {
            if (offset > 0) stream.channel.position(offset)
        } catch (e: Exception) {
            pfd.close()
            throw IOException("Ce fichier ne permet pas de sauter à une position", e)
        }
        return object : FilterInputStream(stream) {
            override fun close() {
                try { super.close() } finally { pfd.close() }
            }
        }
    }
}
