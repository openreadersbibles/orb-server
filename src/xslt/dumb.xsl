<?xml version="3.0" encoding="UTF-8"?>
<xsl:stylesheet version="3.0"
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:tei="http://www.tei-c.org/ns/1.0" 
    xmlns:orb="https://openreadersbibles.org/" 
    exclude-result-prefixes="tei">

    <xsl:param name="filenamebase"></xsl:param>

    <!-- Change output method to xml for XHTML and add doctype declaration -->
    <xsl:output method="html"
                version="5" 
                omit-xml-declaration="yes"
                indent="yes" 
                encoding="UTF-8"/>

    <xsl:template match="/" mode="#default">
        <!-- <xsl:result-document method="html" href="dumb.xml">
            <Hello></Hello>
        </xsl:result-document>
        <xsl:result-document method="html" href="dumber.xml">
            <World></World>
        </xsl:result-document> -->
        <xsl:result-document method="html" href="file:///C:/Users/Adam/Documents/open-readers-bibles/application/orb-server/src/dumb.xml">
            <Hello></Hello>
        </xsl:result-document>
        <xsl:result-document method="html" href="file:///C:/Users/Adam/Documents/open-readers-bibles/application/orb-server/src/dumber.xml">
            <World></World>
        </xsl:result-document>
        <!-- <xsl:result-document method="html" href="file://dumb.xml">
            <Hello></Hello>
        </xsl:result-document>
        <xsl:result-document method="html" href="file://dumber.xml">
            <World></World>
        </xsl:result-document> -->
    </xsl:template>

</xsl:stylesheet>