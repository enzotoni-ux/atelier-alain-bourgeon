package cast.core

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertNull
import kotlin.test.assertTrue

class RangeTest {
    private val len = 1000L

    @Test fun noHeaderIsFull() = assertEquals(RangeResult.Full, MediaServer.parseRange(null, len))
    @Test fun closedRange() = assertEquals(RangeResult.Partial(0, 99), MediaServer.parseRange("bytes=0-99", len))
    @Test fun openEnded() = assertEquals(RangeResult.Partial(900, 999), MediaServer.parseRange("bytes=900-", len))
    @Test fun suffix() = assertEquals(RangeResult.Partial(950, 999), MediaServer.parseRange("bytes=-50", len))
    @Test fun suffixLargerThanFile() = assertEquals(RangeResult.Partial(0, 999), MediaServer.parseRange("bytes=-5000", len))
    @Test fun endClamped() = assertEquals(RangeResult.Partial(10, 999), MediaServer.parseRange("bytes=10-99999", len))
    @Test fun startBeyondEnd() = assertEquals(RangeResult.Unsatisfiable, MediaServer.parseRange("bytes=1000-", len))
    @Test fun reversed() = assertEquals(RangeResult.Unsatisfiable, MediaServer.parseRange("bytes=50-10", len))
    @Test fun zeroSuffix() = assertEquals(RangeResult.Unsatisfiable, MediaServer.parseRange("bytes=-0", len))
    @Test fun multipleRangesServeEverything() = assertEquals(RangeResult.Full, MediaServer.parseRange("bytes=0-1,5-6", len))
    @Test fun garbageServesEverything() = assertEquals(RangeResult.Full, MediaServer.parseRange("bytes=abc-def", len))
    @Test fun otherUnitServesEverything() = assertEquals(RangeResult.Full, MediaServer.parseRange("items=0-1", len))
    @Test fun emptyFile() = assertEquals(RangeResult.Unsatisfiable, MediaServer.parseRange("bytes=0-", 0))
}

class FormatTest {
    @Test fun timeFormat() {
        assertEquals("0:00:00", Time.format(0))
        assertEquals("1:02:05", Time.format(3725))
        assertEquals("0:00:00", Time.format(-4))
    }

    @Test fun timeParse() {
        assertEquals(3725, Time.parse("1:02:05"))
        assertEquals(12, Time.parse("0:00:12.500"))
        assertNull(Time.parse("NOT_IMPLEMENTED"))
        assertNull(Time.parse(null))
        assertNull(Time.parse(""))
    }

    @Test fun mimeByExtension() {
        assertEquals("video/x-matroska", Mime.forName("Film.MKV"))
        assertEquals("video/mp4", Mime.forName("a.mp4"))
        assertEquals("video/mp4", Mime.forName("sans-extension"))
    }

    @Test fun didlEscapesTitleAndUrl() {
        val didl = Didl.item("Tom & Jerry <1> \"é\"", "http://1.2.3.4:80/media/1/a?x=1&y=2", "video/mp4", 42)
        assertTrue(didl.contains("Tom &amp; Jerry &lt;1&gt; &quot;é&quot;"))
        assertTrue(didl.contains("x=1&amp;y=2"))
        assertTrue(didl.contains("size=\"42\""))
        // Le XML doit rester bien formé.
        Xml.parse(didl)
    }

    @Test fun ssdpParsesHeadersCaseInsensitively() {
        val h = Ssdp.parse("HTTP/1.1 200 OK\r\nLocation: http://a/b.xml\r\nST: urn:x\r\nUSN: uuid:1\r\n\r\n")
        assertEquals("http://a/b.xml", h["location"])
        assertEquals("urn:x", h["st"])
    }

    @Test fun soapErrorParsing() {
        val xml = """<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/"><s:Body><s:Fault>
            <detail><UPnPError xmlns="urn:schemas-upnp-org:control-1-0"><errorCode>701</errorCode>
            <errorDescription>Transition not available</errorDescription></UPnPError></detail></s:Fault></s:Body></s:Envelope>"""
        assertEquals(701 to "Transition not available", Upnp.parseError(xml))
        assertEquals(null to null, Upnp.parseError("pas du xml"))
    }

    @Test fun doctypeIsRejected() {
        val evil = "<?xml version=\"1.0\"?><!DOCTYPE x [<!ENTITY a SYSTEM \"file:///etc/passwd\">]><x>&a;</x>"
        val failed = try { Xml.parse(evil); false } catch (e: Exception) { true }
        assertTrue(failed)
    }

    @Test fun xmlEscapeRoundTrip() {
        val raw = "a&b<c>\"d'"
        val doc = Xml.parse("<x>${Xml.escape(raw)}</x>")
        assertEquals(raw, doc.documentElement.textContent)
        assertFalse(Xml.escape(raw).contains('<'))
    }
}
