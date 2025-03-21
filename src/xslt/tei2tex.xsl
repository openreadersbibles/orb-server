<?xml version="1.0" encoding="UTF-8"?>
<!-- 
xsltproc  -o sblgnt-biblebento_NT_1JN.tex tei2tex.xsl sblgnt-biblebento_NT_1JN.xml
xsltproc  -o farsi_OT_JON.tex tei2tex.xsl farsi_OT_JON.xml
xsltproc  -o bhsa_OT_JON.tex tei2tex.xsl bhsa_OT_JON.xml
 -->
<xsl:stylesheet version="1.0"
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:tei="http://www.tei-c.org/ns/1.0" exclude-result-prefixes="tei">

    <xsl:output method="text"/>

    <!-- Identity template to copy elements by default -->
    <xsl:template match="@*|node()">
        <xsl:copy>
            <xsl:apply-templates select="@*|node()"/>
        </xsl:copy>
    </xsl:template>

    <!-- Template to match the root TEI element -->
    <xsl:template match="tei:TEI">
        <xsl:apply-templates select="tei:text/tei:body"/>
    </xsl:template>

    <!-- Template to match chapters -->
    <xsl:template match="tei:body/tei:div[@type='chapter']">
        <xsl:text>&#10;\section*{</xsl:text>
        <xsl:value-of select="@n"/>
        <xsl:text>}&#10;</xsl:text>
        <xsl:apply-templates/>
    </xsl:template>

    <xsl:template match="tei:div[@type='verse']">
        <xsl:text>&#10;\MainTextVerseMark{</xsl:text>
        <xsl:value-of select="parent::tei:div/@n"/>
        <xsl:text>}{</xsl:text>
        <xsl:value-of select="@n"/>
        <xsl:text>}&#10;</xsl:text>
        <xsl:apply-templates/>
    </xsl:template>

    <xsl:template match="tei:note[@type='gloss']">
        <xsl:choose>

            <xsl:when test="tei:gloss[@type='parsing'] and tei:gloss[@type='lexical-form'] and tei:gloss[@type='gloss']">
                <xsl:text>\FnParseFormGloss{</xsl:text>
                <xsl:apply-templates select="tei:gloss[@type='parsing']"/>
                <xsl:text>}{</xsl:text>
                <xsl:apply-templates select="tei:gloss[@type='lexical-form']"/>
                <xsl:text>}{</xsl:text>
                <xsl:apply-templates select="tei:gloss[@type='gloss']"/>
                <xsl:text>}</xsl:text>
            </xsl:when>

            <xsl:when test="tei:gloss[@type='lexical-form'] and tei:gloss[@type='gloss']">
                <xsl:text>\FnFormGloss{</xsl:text>
                <xsl:apply-templates select="tei:gloss[@type='lexical-form']"/>
                <xsl:text>}{</xsl:text>
                <xsl:apply-templates select="tei:gloss[@type='gloss']"/>
                <xsl:text>}</xsl:text>
            </xsl:when>

            <xsl:when test="tei:gloss[@type='parsing']">
                <xsl:text>\FnParse{</xsl:text>
                <xsl:apply-templates/>
                <xsl:text>}</xsl:text>
            </xsl:when>
            <xsl:otherwise>
                <xsl:message>Unexpected note format</xsl:message>
            </xsl:otherwise>
        </xsl:choose>
    </xsl:template>

</xsl:stylesheet>