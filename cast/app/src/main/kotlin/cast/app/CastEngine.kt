package cast.app

import android.content.Context
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import cast.core.Caster
import cast.core.CastSession
import cast.core.MediaSource
import cast.core.Net
import cast.core.Renderer
import java.net.DatagramSocket
import java.net.HttpURLConnection
import java.net.Inet4Address
import java.util.concurrent.Executors

/** État partagé entre l'écran et le service ; il survit à la rotation de l'écran. */
object CastEngine {
    val caster = Caster()
    private val io = Executors.newSingleThreadExecutor()

    @Volatile var renderers: List<Renderer> = emptyList()
    @Volatile var selected: Renderer? = null
    @Volatile var source: MediaSource? = null
    @Volatile var session: CastSession? = null

    /** Les commandes à la TV s'exécutent l'une après l'autre, hors du thread principal. */
    fun run(block: () -> Unit) = io.execute { block() }

    fun stopAll() {
        val s = session
        session = null
        run {
            try { s?.transport?.stop() } catch (e: Exception) { }
            caster.stopServer()
        }
    }

    /**
     * Force le trafic vers la TV à passer par le Wi-Fi. Sans cela, un téléphone en 4G + Wi-Fi sans
     * accès internet peut envoyer ses paquets vers le réseau mobile, et la TV reste introuvable.
     */
    fun bindToWifi(context: Context): Boolean {
        val cm = context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        @Suppress("DEPRECATION")
        val wifi = cm.allNetworks.firstOrNull {
            cm.getNetworkCapabilities(it)?.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) == true
        }
        if (wifi == null) {
            Net.openConnection = { it.openConnection() as HttpURLConnection }
            Net.newDatagramSocket = { DatagramSocket() }
            Net.preferredLocalAddress = null
            return false
        }
        Net.openConnection = { wifi.openConnection(it) as HttpURLConnection }
        Net.newDatagramSocket = { DatagramSocket().also { s -> wifi.bindSocket(s) } }
        Net.preferredLocalAddress = cm.getLinkProperties(wifi)?.linkAddresses
            ?.map { it.address }
            ?.firstOrNull { it is Inet4Address && !it.isLoopbackAddress }
            ?.hostAddress
        return true
    }
}
