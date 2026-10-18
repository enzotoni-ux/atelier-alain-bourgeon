package cast.app

import android.Manifest
import android.app.Activity
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.net.wifi.WifiManager
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.Gravity
import android.view.View
import android.widget.ArrayAdapter
import android.widget.Button
import android.widget.LinearLayout
import android.widget.ListView
import android.widget.ScrollView
import android.widget.SeekBar
import android.widget.TextView
import android.widget.Toast
import cast.core.CastSession
import cast.core.Time

class MainActivity : Activity() {

    private val ui = Handler(Looper.getMainLooper())

    private lateinit var status: TextView
    private lateinit var searchBtn: Button
    private lateinit var tvList: ListView
    private lateinit var pickBtn: Button
    private lateinit var fileLabel: TextView
    private lateinit var castBtn: Button
    private lateinit var controls: LinearLayout
    private lateinit var playPauseBtn: Button
    private lateinit var seekBar: SeekBar
    private lateinit var timeLabel: TextView
    private lateinit var volumeBar: SeekBar
    private lateinit var volumeLabel: TextView
    private lateinit var adapter: ArrayAdapter<String>
    private val names = ArrayList<String>()

    private var dragging = false
    private var polling = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        buildUi()
        handleIntent(intent)
        refresh()
        if (Build.VERSION.SDK_INT >= 33 && checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(arrayOf(Manifest.permission.POST_NOTIFICATIONS), 1)
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        handleIntent(intent)
        refresh()
    }

    override fun onResume() {
        super.onResume()
        polling = true
        poll()
    }

    override fun onPause() {
        super.onPause()
        polling = false
    }

    // ---------- interface ----------

    private fun dp(v: Int) = (v * resources.displayMetrics.density).toInt()

    private fun button(text: String, onClick: () -> Unit) = Button(this).apply {
        this.text = text
        isAllCaps = false
        setOnClickListener { onClick() }
    }

    private fun label(size: Float = 14f, bold: Boolean = false) = TextView(this).apply {
        textSize = size
        if (bold) setTypeface(typeface, android.graphics.Typeface.BOLD)
    }

    private fun buildUi() {
        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(20), dp(24), dp(20), dp(24))
        }

        root.addView(label(24f, true).apply { text = "Cast Phone" })
        status = label(14f).apply {
            setPadding(0, dp(4), 0, dp(16))
            text = "Connectez le téléphone au même Wi-Fi que la TV."
        }
        root.addView(status)

        searchBtn = button("1. Chercher les TV") { search() }
        root.addView(searchBtn)

        adapter = ArrayAdapter(this, android.R.layout.simple_list_item_single_choice, names)
        tvList = ListView(this).apply {
            choiceMode = ListView.CHOICE_MODE_SINGLE
            adapter = this@MainActivity.adapter
            setOnItemClickListener { _, _, position, _ ->
                CastEngine.selected = CastEngine.renderers.getOrNull(position)
                refresh()
            }
        }
        root.addView(tvList, LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, dp(170)))

        pickBtn = button("2. Choisir un film") { pickFile() }
        root.addView(pickBtn)
        fileLabel = label(14f).apply { setPadding(0, dp(4), 0, dp(12)); text = "Aucun film choisi" }
        root.addView(fileLabel)

        castBtn = button("3. Lancer sur la TV") { startCast() }
        root.addView(castBtn)

        controls = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL; visibility = View.GONE }
        val row = LinearLayout(this).apply { gravity = Gravity.CENTER; setPadding(0, dp(16), 0, 0) }
        row.addView(button("−10 s") { skip(-10) })
        playPauseBtn = button("Pause / Lecture") { togglePlay() }
        row.addView(playPauseBtn)
        row.addView(button("+30 s") { skip(30) })
        row.addView(button("Stop") { stopCast() })
        controls.addView(row)

        seekBar = SeekBar(this).apply {
            setOnSeekBarChangeListener(object : SeekBar.OnSeekBarChangeListener {
                override fun onProgressChanged(bar: SeekBar, progress: Int, fromUser: Boolean) {
                    if (fromUser) timeLabel.text = Time.format(progress) + " / " + Time.format(bar.max)
                }
                override fun onStartTrackingTouch(bar: SeekBar) { dragging = true }
                override fun onStopTrackingTouch(bar: SeekBar) {
                    dragging = false
                    val target = bar.progress
                    withSession { it.transport.seek(target) }
                }
            })
        }
        controls.addView(seekBar)
        timeLabel = label(13f).apply { gravity = Gravity.CENTER; text = "0:00:00 / 0:00:00" }
        controls.addView(timeLabel)

        volumeLabel = label(13f).apply { setPadding(0, dp(12), 0, 0); text = "Volume de la TV" }
        controls.addView(volumeLabel)
        volumeBar = SeekBar(this).apply {
            max = 100
            setOnSeekBarChangeListener(object : SeekBar.OnSeekBarChangeListener {
                override fun onProgressChanged(bar: SeekBar, progress: Int, fromUser: Boolean) {}
                override fun onStartTrackingTouch(bar: SeekBar) {}
                override fun onStopTrackingTouch(bar: SeekBar) {
                    val v = bar.progress
                    withSession { it.volume.setVolume(v) }
                }
            })
        }
        controls.addView(volumeBar)
        root.addView(controls)

        setContentView(ScrollView(this).apply { addView(root) })
    }

    /** Remet l'écran d'accord avec l'état courant (TV choisie, film choisi, lecture en cours). */
    private fun refresh() {
        names.clear()
        names.addAll(CastEngine.renderers.map { it.name })
        adapter.notifyDataSetChanged()
        val idx = CastEngine.renderers.indexOf(CastEngine.selected)
        if (idx >= 0) tvList.setItemChecked(idx, true)

        val src = CastEngine.source
        fileLabel.text = src?.name ?: "Aucun film choisi"
        castBtn.isEnabled = CastEngine.selected != null && src != null
        controls.visibility = if (CastEngine.session != null) View.VISIBLE else View.GONE
    }

    private fun setStatus(text: String) { status.text = text }

    private fun toast(text: String) = Toast.makeText(this, text, Toast.LENGTH_LONG).show()

    // ---------- actions ----------

    private fun search() {
        searchBtn.isEnabled = false
        searchBtn.text = "Recherche…"
        setStatus("Recherche des TV sur le Wi-Fi…")
        val app = applicationContext
        Thread {
            val wifiOk = CastEngine.bindToWifi(app)
            val lock = (app.getSystemService(Context.WIFI_SERVICE) as WifiManager)
                .createMulticastLock("castphone").apply { setReferenceCounted(false); acquire() }
            val found = try {
                CastEngine.caster.findRenderers(4000)
            } catch (e: Exception) {
                emptyList()
            } finally {
                lock.release()
            }
            runOnUiThread {
                CastEngine.renderers = found
                if (CastEngine.selected !in found) CastEngine.selected = found.singleOrNull()
                searchBtn.isEnabled = true
                searchBtn.text = "1. Chercher les TV"
                setStatus(
                    when {
                        !wifiOk -> "Pas de Wi-Fi : connectez le téléphone au même Wi-Fi que la TV."
                        found.isEmpty() -> "Aucune TV trouvée. Vérifiez qu'elle est allumée, sur le même Wi-Fi, et que le partage DLNA / « lecteur multimédia » est actif dans ses réglages."
                        else -> "${found.size} TV trouvée(s). Choisissez-en une."
                    }
                )
                refresh()
            }
        }.start()
    }

    private fun pickFile() {
        val i = Intent(Intent.ACTION_OPEN_DOCUMENT).apply {
            addCategory(Intent.CATEGORY_OPENABLE)
            type = "video/*"
        }
        @Suppress("DEPRECATION")
        startActivityForResult(i, REQ_PICK)
    }

    @Deprecated("Deprecated in Java")
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode == REQ_PICK && resultCode == RESULT_OK) {
            data?.data?.let {
                try { contentResolver.takePersistableUriPermission(it, Intent.FLAG_GRANT_READ_URI_PERMISSION) } catch (e: Exception) { }
                setSource(it)
                refresh()
            }
        }
    }

    private fun handleIntent(i: Intent?) {
        if (i == null) return
        val uri: Uri? = when (i.action) {
            Intent.ACTION_VIEW -> i.data
            Intent.ACTION_SEND -> i.getParcelableExtra<Uri>(Intent.EXTRA_STREAM)
            else -> null
        }
        if (uri != null) setSource(uri)
    }

    private fun setSource(uri: Uri) {
        try {
            CastEngine.source = ContentUriSource(contentResolver, uri)
        } catch (e: Exception) {
            CastEngine.source = null
            toast("Impossible de lire ce fichier : ${e.message}")
        }
    }

    private fun startCast() {
        val tv = CastEngine.selected ?: return
        val src = CastEngine.source ?: return
        if (src.length <= 0) { toast("Le fichier semble vide ou illisible."); return }
        castBtn.isEnabled = false
        setStatus("Envoi à ${tv.name}…")
        CastService.start(this)
        val app = applicationContext
        CastEngine.run {
            try {
                CastEngine.bindToWifi(app)
                val session = CastEngine.caster.cast(tv, src)
                CastEngine.session = session
                val vol = if (session.volume.available) try { session.volume.volume() } catch (e: Exception) { null } else null
                runOnUiThread {
                    setStatus("Lecture sur ${tv.name}. Le film est lu par la TV : si l'image ne vient pas, son format n'est peut-être pas pris en charge.")
                    volumeBar.visibility = if (session.volume.available) View.VISIBLE else View.GONE
                    volumeLabel.visibility = volumeBar.visibility
                    if (vol != null) volumeBar.progress = vol
                    refresh()
                }
            } catch (e: Exception) {
                CastEngine.session = null
                CastEngine.caster.stopServer()
                runOnUiThread {
                    setStatus("Échec : ${e.message ?: e.javaClass.simpleName}")
                    CastService.stop(this)
                    refresh()
                }
            }
        }
    }

    /** Exécute une commande sur la TV en cours ; les erreurs s'affichent au lieu de planter. */
    private fun withSession(block: (CastSession) -> Unit) {
        val s = CastEngine.session ?: return
        CastEngine.run {
            try { block(s) } catch (e: Exception) { runOnUiThread { toast("La TV a refusé : ${e.message}") } }
        }
    }

    private fun togglePlay() = withSession {
        if (it.transport.state() == "PLAYING") it.transport.pause() else it.transport.play()
    }

    private fun skip(deltaSec: Int) = withSession {
        val p = it.transport.position()
        val now = p.positionSec ?: return@withSession
        val max = p.durationSec ?: Int.MAX_VALUE
        it.transport.seek((now + deltaSec).coerceIn(0, max))
    }

    private fun stopCast() {
        CastEngine.stopAll()
        CastService.stop(this)
        setStatus("Lecture arrêtée.")
        refresh()
    }

    /** Une fois par seconde : met à jour la barre de position avec ce que la TV rapporte. */
    private fun poll() {
        if (!polling) return
        val s = CastEngine.session
        if (s != null && !dragging) {
            CastEngine.run {
                try {
                    val p = s.transport.position()
                    runOnUiThread {
                        val d = p.durationSec ?: 0
                        val pos = p.positionSec ?: 0
                        if (!dragging && CastEngine.session === s) {
                            seekBar.max = maxOf(d, 1)
                            seekBar.progress = pos.coerceAtMost(seekBar.max)
                            timeLabel.text = Time.format(pos) + " / " + Time.format(d)
                        }
                    }
                } catch (e: Exception) {
                    // coupure ponctuelle du Wi-Fi ou TV occupée : on réessaie à la seconde suivante
                }
            }
        }
        ui.postDelayed({ poll() }, 1000)
    }

    companion object {
        private const val REQ_PICK = 42
    }
}
